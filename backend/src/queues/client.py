import os
import time
import aiohttp
import asyncio
from celery import Celery
from loguru import logger

from databases.postgres import DatabaseSession, Episode
from libraries.anime_scraper import ScraperFactory
from utils.utils import format_size

from .config import redis_settings

HOST = redis_settings.REDIS_HOST
PORT = redis_settings.REDIS_PORT
QUEUE_NAME = redis_settings.REDIS_QUEUE_NAME
PATH = redis_settings.ANIME_FOLDER

MAX_RETRIES = 5
RETRY_INTERVAL = 5

scraper = ScraperFactory.get_scraper("animeflv")

celery_app = Celery(
    "tasks",
    broker=f"redis://{HOST}:{PORT}/0",
    backend=f"redis://{HOST}:{PORT}/0",
)

celery_app.conf.update(
    result_expires=3600,
    task_serializer="json",
    accept_content=["json"],
    result_backend=f"redis://{HOST}:{PORT}/0",
    task_routes={
        "tasks.enqueue_range_episodes_download_links_process": {
            "queue": QUEUE_NAME
        }
    },
    worker_pool="threads",
    worker_concurrency=10,
    broker_connection_retry_on_startup=True,
    worker_prefetch_multiplier=1,
)


timeout = aiohttp.ClientTimeout(
    total=None, connect=None, sock_connect=None, sock_read=600
)


async def download_episode(
    job_client,
    anime: str,
    episode_id: int,
    link: str,
    name: str,
    service: str,
):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(link, timeout=1800) as response:
                logger.info(f"Downloading {name} from {service}")
                if response.status == 200:
                    total_size = int(response.headers.get("Content-Length", 0))
                    formated_total_size = format_size(total_size)

                    if total_size == 0:
                        logger.warning(
                            f"No se encontró Content-Length para {name}. "
                            + "No se podrá calcular el progreso."
                        )

                    with DatabaseSession() as db:
                        episode = (
                            db.query(Episode)
                            .filter(Episode.id == episode_id)
                            .first()
                        )
                        if episode:
                            episode.size = total_size
                            db.commit()
                            db.refresh(episode)

                    folder_path = f"{PATH}/{anime}"
                    os.makedirs(folder_path, exist_ok=True)
                    save_path = f"{folder_path}/{name}.mp4"

                    with open(save_path, "wb") as f:
                        downloaded = 0
                        last_update_time = time.time()
                        update_interval = 5
                        async for chunk in response.content.iter_chunked(1024):
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
                                    job_client.update_state(
                                        state="DOWNLOADING",
                                        meta={
                                            "total": formated_total_size,
                                            "progress": progress,
                                        },
                                    )
                else:
                    logger.error(
                        f"Error downloading {name}: {response.status}"
                    )
                    return False
        logger.info(f"Downloaded {name}")
        return True
    except Exception as e:
        logger.error(f"Error downloading {name}: {e}")
        return False


@celery_app.task(bind=True, max_retries=MAX_RETRIES)
def enqueue_episode_download_link_process(
    self,
    episode_id: int,
    link: dict,
    anime_name: str,
):
    episode_name = link.split("/")[-1]

    logger.info(f"Gathering download link for {episode_name}")
    logger.info(f"Job ID: {self.request.id}")

    self.update_state(state="GETTING-LINK")

    anime_download_info = asyncio.run(scraper.get_download_link(link))
    download_info = anime_download_info.get("download_info")

    if not download_info:
        logger.error(f"Error getting download link for {episode_name}")
        self.retry(countdown=RETRY_INTERVAL)

    service = download_info["service"]
    download_link = download_info["link"]

    logger.info(f"Downloading {episode_name} from {anime_name}")

    self.update_state(state="DOWNLOADING")

    download_status = asyncio.run(
        download_episode(
            self,
            anime_name,
            episode_id,
            download_link,
            episode_name,
            service,
        )
    )

    if not download_status:
        logger.error(f"Error downloading {episode_name}")
        self.retry(countdown=RETRY_INTERVAL)

    with DatabaseSession() as db:
        episode = db.query(Episode).filter(Episode.id == episode_id).first()

        if episode:
            episode.job_id = None
            episode.file_path = f"{PATH}/{anime_name}/{episode_name}.mp4"
            db.commit()
            db.refresh(episode)

    self.update_state(state="SUCCESS")
