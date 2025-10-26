import json
from pathlib import Path
import time
from loguru import logger
import requests
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from celery.exceptions import MaxRetriesExceededError

from ani_scrapy.sync_api import JKAnimeScraper, SyncBrowser
from database import DatabaseSession, Anime, Episode
from redis_client import redis_db
from config import general_settings
from utils import (
    get_ordering_key,
    get_download_key,
    stream_add_event,
    stream_wait_event,
)

scraper = JKAnimeScraper(verbose=True, level="DEBUG")


ANIMES_FOLDER = general_settings.ANIMES_FOLDER
MAX_DOWNLOAD_RETRIES = general_settings.MAX_DOWNLOAD_RETRIES
RETRY_DOWNLOAD_INTERVAL = general_settings.RETRY_DOWNLOAD_INTERVAL

CHUNK_SIZE = 2048


def update_episode_status(
    anime_id: str, episode_number: int, status: str, job_id: str = None
):
    with DatabaseSession() as db:
        stmt = select(Episode).filter_by(
            anime_id=anime_id, ep_number=episode_number
        )
        episode = db.execute(stmt).scalar_one_or_none()
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


def notify_job(job_id: str, state: str, meta: dict):
    payload = {
        "job_id": job_id,
        "state": state,
        "meta": meta,
    }
    redis_db.publish("job_updates", json.dumps(payload))


def get_anime_episode_franchise(anime_id: str):
    with DatabaseSession() as db:
        stmt = select(Anime).filter(Anime.id == anime_id)
        anime = db.execute(stmt).scalar_one_or_none()
        return anime.franchise_id


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

                franchise_id = None
                with DatabaseSession() as db:
                    stmt = (
                        select(Episode)
                        .where(
                            Episode.anime_id == anime,
                            Episode.ep_number == episode_number,
                        )
                        .options(
                            selectinload(Episode.anime),
                        )
                    )
                    episode = db.execute(stmt).scalar_one()
                    episode.size = total_size
                    franchise_id = episode.anime.franchise_id
                    db.add(episode)

                parsed_season = str(season).zfill(2)
                anime_folder = (
                    Path(ANIMES_FOLDER) / anime / f"Season {parsed_season}"
                )
                if franchise_id:
                    anime_folder = (
                        Path(ANIMES_FOLDER)
                        / franchise_id
                        / f"Season {parsed_season}"
                    )
                anime_folder.mkdir(exist_ok=True)

                parsed_ep_number = str(episode_number).zfill(2)
                save_path = (
                    anime_folder
                    / f"{anime} - S{parsed_season}E{parsed_ep_number}.mp4"
                )

                with open(str(save_path), "wb") as f:
                    downloaded = 0
                    last_update_time = time.time()
                    update_interval = 1
                    for chunk in response.iter_content(chunk_size=CHUNK_SIZE):
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


def download_anime_episode_controller(
    self,
    anime_id: str,
    episode_number: int,
    user_id: str,
    request_id: str,
):
    is_firt_try = self.request.retries == 0

    franchise_id = get_anime_episode_franchise(anime_id)
    if franchise_id and is_firt_try:
        ordering_key = get_ordering_key(franchise_id)
        logger.info(f"Checking ordering key: {ordering_key}")
        if redis_db.exists(ordering_key):
            logger.info(
                f"Waiting for ordering lock on {anime_id} - {episode_number}"
            )
            stream_wait_event(franchise_id, "ordering_done")

        download_key = get_download_key(franchise_id)
        logger.info(f"Incrementing download key: {download_key}")
        redis_db.incr(download_key)

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

            logger.info(f"Downloaded {anime_id} - {episode_number}")

            franchise_id = get_anime_episode_franchise(anime_id)
            if franchise_id:
                logger.info(f"Decrementing download count for {anime_id}")
                download_key = get_download_key(franchise_id)
                count = redis_db.decr(download_key)
                if count == 0:
                    stream_add_event(franchise_id, "downloads_done")

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

            franchise_id = get_anime_episode_franchise(anime_id)
            if franchise_id:
                logger.info(f"Decrementing download count for {anime_id}")
                download_key = get_download_key(franchise_id)
                count = redis_db.decr(download_key)
                if count == 0:
                    stream_add_event(franchise_id, "downloads_done")

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
