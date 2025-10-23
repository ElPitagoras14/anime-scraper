import os
import requests
import time
import asyncio
import sys
import redis
import json
from celery import Celery
from celery.signals import worker_ready
from celery.exceptions import MaxRetriesExceededError
from loguru import logger
from ani_scrapy.sync_api import JKAnimeScraper, SyncBrowser

from database.client import DatabaseSession
from database.models import Episode
from config import general_settings

if sys.platform == "win32":
    loop = asyncio.ProactorEventLoop()
    asyncio.set_event_loop(loop)

scraper = JKAnimeScraper(verbose=True, level="DEBUG")

REDIS_URL = general_settings.REDIS_URL
MAX_DOWNLOAD_RETRIES = general_settings.MAX_DOWNLOAD_RETRIES
RETRY_DOWNLOAD_INTERVAL = general_settings.RETRY_DOWNLOAD_INTERVAL
ANIMES_FOLDER = general_settings.ANIMES_FOLDER

os.makedirs(ANIMES_FOLDER, exist_ok=True)

redis_pub = redis.Redis.from_url(f"{REDIS_URL}/2")

celery_app = Celery(
    "queues",
    broker=f"{REDIS_URL}/0",
    backend=f"{REDIS_URL}/1",
)

celery_app.conf.update(
    result_expires=3600,
    task_serializer="json",
    accept_content=["json"],
    result_backend=f"{REDIS_URL}/1",
    worker_pool="threads",
    worker_concurrency=5,
    broker_connection_retry_on_startup=True,
    worker_prefetch_multiplier=1,
)


@worker_ready.connect
def on_worker_ready(**kwargs):
    logger.info("Celery workers are ready")


def notify_job(job_id: str, state: str, meta: dict):
    payload = {
        "job_id": job_id,
        "state": state,
        "meta": meta,
    }
    redis_pub.publish("job_updates", json.dumps(payload))


def download_episode(
    job_id: str,
    anime: str,
    season: int,
    episode_number: int,
    download_link: str,
    server: str,
):
    try:
        with requests.get(download_link, stream=True) as response:
            response.raise_for_status()
            logger.info(
                f"Downloading {anime} - {episode_number} from {server}"
            )
            if response.status_code == 200:
                total_size = int(response.headers.get("Content-Length", 0))

                with DatabaseSession() as db:
                    episode = (
                        db.query(Episode)
                        .filter(
                            Episode.anime_id == anime,
                            Episode.ep_number == episode_number,
                        )
                        .first()
                    )
                    episode.size = total_size
                    db.add(episode)

                parsed_season = str(season).zfill(2)
                anime_folder = (
                    f"{ANIMES_FOLDER}/{anime}/Season {parsed_season}"
                )
                os.makedirs(anime_folder, exist_ok=True)

                parsed_episode_number = str(episode_number).zfill(2)
                save_path = (
                    f"{anime_folder}/{anime} - S{parsed_season}E"
                    + f"{parsed_episode_number}.mp4"
                )

                with open(save_path, "wb") as f:
                    downloaded = 0
                    last_update_time = time.time()
                    update_interval = 1
                    for chunk in response.iter_content(chunk_size=2048):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)

                            progress = downloaded / total_size * 100
                            current_time = time.time()
                            if (
                                current_time - last_update_time
                                > update_interval
                            ):
                                last_update_time = current_time
                                notify_job(
                                    job_id,
                                    "DOWNLOADING",
                                    {
                                        "total": total_size,
                                        "progress": progress,
                                    },
                                )
                                logger.info(
                                    f"Downloaded {anime} - {episode_number} "
                                    + f"from {server} in {progress:.2f}%"
                                )
            else:
                logger.error(f"Error downloading {anime}: {response.status}")
                return False
    except Exception as e:
        logger.error(f"Error downloading {anime} - {episode_number}: {e}")
        return False
    return True


def update_episode_status(
    anime_id: str, episode_number: int, status: str, job_id: str = None
):
    with DatabaseSession() as db:
        episode = (
            db.query(Episode)
            .filter(
                Episode.anime_id == anime_id,
                Episode.ep_number == episode_number,
            )
            .first()
        )
        if not episode:
            logger.error(f"Episode {anime_id} - {episode_number} not found")
            return
        episode.status = status
        if job_id is not None:
            episode.job_id = job_id
        db.add(episode)
        logger.info(
            f"Episode {anime_id} - {episode_number} updated to {status}"
        )


@celery_app.task(
    name="tasks.download_anime_episode",
    bind=True,
    max_retries=MAX_DOWNLOAD_RETRIES,
    default_retry_delay=RETRY_DOWNLOAD_INTERVAL,
)
def download_anime_episode(
    self,
    anime_id: str,
    episode_number: int,
    user_id: str,
    request_id: str,
):
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    logger.contextualize(request_id=request_id, user_id=user_id)
    logger.info(
        f"Trying to download anime with id: {anime_id} - {episode_number}"
    )
    logger.info(f"Job ID: {self.request.id}")

    try:
        logger.info(
            f"Getting server download link for {anime_id} - {episode_number}"
        )
        self.update_state(state="GETTING-LINK")
        season = 1
        update_episode_status(
            anime_id, episode_number, "GETTING-LINK", self.request.id
        )
        notify_job(self.request.id, "GETTING-LINK", {})

        with SyncBrowser() as b:
            download_info = scraper.get_table_download_links(
                anime_id, episode_number, browser=b
            )
            download_links = download_info.download_links

            if len(download_links) == 0:
                error_msg = (
                    f"Error getting download link for {anime_id} "
                    + f"- {episode_number}"
                )
                logger.error(error_msg)
                raise Exception(error_msg)

            logger.info(
                f"Getting file download link for {anime_id} - {episode_number}"
            )
            self.update_state(state="GETTING-FILE-LINK")
            update_episode_status(
                anime_id, episode_number, "GETTING-FILE-LINK"
            )
            notify_job(self.request.id, "GETTING-FILE-LINK", {})

            valid_download_link = None
            selected_download_info = None
            for download_info in download_links:
                file_download_link = scraper.get_file_download_link(
                    download_info, browser=b
                )
                if file_download_link:
                    valid_download_link = file_download_link
                    selected_download_info = download_info
                    break

            if not valid_download_link:
                error_msg = (
                    f"Error getting file download link for {anime_id} - "
                    + f"{episode_number}"
                )
                logger.error(error_msg)
                raise Exception(error_msg)

            self.update_state(state="DOWNLOADING")
            update_episode_status(anime_id, episode_number, "DOWNLOADING")
            notify_job(self.request.id, "DOWNLOADING", {})
            download_status = download_episode(
                self.request.id,
                anime_id,
                season,
                episode_number,
                valid_download_link,
                selected_download_info.server,
            )

            if not download_status:
                error_msg = f"Error downloading {anime_id} - {episode_number}"
                logger.error(error_msg)
                raise Exception(error_msg)

            self.update_state(state="SUCCESS")
            update_episode_status(anime_id, episode_number, "SUCCESS", None)
            notify_job(self.request.id, "SUCCESS", {})
    except Exception as e:
        logger.error(f"Error downloading {anime_id} - {episode_number}: {e}")

        if self.request.retries >= MAX_DOWNLOAD_RETRIES:
            logger.error(
                f"Max retries exceeded for {anime_id} - {episode_number}"
            )
            update_episode_status(
                anime_id, episode_number, "FAILED", self.request.id
            )
            notify_job(self.request.id, "FAILED", {})
            raise MaxRetriesExceededError(
                f"Max retries exceeded for {anime_id} - {episode_number}"
            )

        countdown = RETRY_DOWNLOAD_INTERVAL * (2**self.request.retries)
        logger.warning(
            f"Retrying task in {countdown} seconds "
            + f"(attempt {self.request.retries + 1})"
        )

        update_episode_status(anime_id, episode_number, "RETRYING")
        notify_job(
            self.request.id,
            "RETRYING",
            {
                "retry_count": self.request.retries + 1,
                "max_retries": self.max_retries,
                "next_retry_in": countdown,
            },
        )

        raise self.retry(countdown=countdown, exc=e, throw=False)


if __name__ == "__main__":
    args = ["worker", "--loglevel=info"]
    celery_app.worker_main(argv=args)
