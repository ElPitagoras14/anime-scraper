import shutil
from loguru import logger
from sqlalchemy import select, func, distinct
from pathlib import Path

from database import DatabaseSession, Anime, Episode
from redis_client import redis_db
from config import general_settings
from schemas import FranchiseInfo
from utils import (
    get_ordering_key,
    get_download_key,
    stream_add_event,
    stream_wait_event,
)

ANIMES_FOLDER = general_settings.ANIMES_FOLDER


def get_same_anime(anime_id: str, animes: list[dict]):
    for anime in animes:
        if anime["id"] == anime_id:
            return anime
    return None


def get_started_download_count(franchise_id: str):
    with DatabaseSession() as db:
        stmt = (
            select(func.count(distinct(Episode.id)))
            .select_from(Anime)
            .join(Episode)
            .filter(
                Anime.franchise_id == franchise_id,
                Episode.anime_id == Anime.id,
                Episode.status != "PENDING",
                Episode.status != "SUCCESS",
                Episode.status != "FAILED",
            )
        )
        count = db.execute(stmt).scalar_one_or_none()
        return count


def order_franchise_controller(franchise_info: FranchiseInfo):
    franchise_id = franchise_info["id"]
    ordering_key = get_ordering_key(franchise_id)
    logger.info(f"Setting ordering key: {ordering_key}")
    redis_db.set(ordering_key, 1)

    download_key = get_download_key(franchise_id)
    count = get_started_download_count(franchise_id)
    logger.info(f"Setting download key: {download_key}")
    redis_db.set(download_key, count)

    if count > 0:
        logger.info(f"Waiting for {count} downloads to finish")
        stream_wait_event(franchise_id, "downloads_done")

    logger.info(f"Ordering {franchise_id} franchise")

    franchise_folder = Path(ANIMES_FOLDER) / franchise_id
    franchise_folder.mkdir(exist_ok=True)

    with DatabaseSession() as db:
        stmt = select(Anime).where(Anime.franchise_id == franchise_id)
        animes = db.execute(stmt).scalars().all()

        logger.info(f"Found {len(animes)} animes")

        for anime in animes:
            anime_id = anime.id
            parsed_season = str(anime.season).zfill(2)
            anime_folder = (
                Path(ANIMES_FOLDER) / anime_id / f"Season {parsed_season}"
            )
            if not anime_folder.exists():
                logger.error(f"Anime folder not found: {anime_folder}")
                continue

            logger.info(f"Moving {anime_id} anime")

            same_anime = get_same_anime(anime_id, franchise_info["animes"])
            logger.info(f"Same anime: {same_anime}")
            new_parsed_season = str(same_anime["season"]).zfill(2)

            new_anime_folder = (
                Path(ANIMES_FOLDER)
                / franchise_id
                / f"Season {new_parsed_season}"
            )

            logger.info(f"Old anime folder: {anime_folder}")
            logger.info(f"New anime folder: {new_anime_folder}")

            shutil.move(str(anime_folder), str(new_anime_folder))

            old_anime_folder = Path(ANIMES_FOLDER) / anime_id
            old_anime_folder.rmdir()

            anime.season = same_anime["season"]
            db.add(anime)

            for file in new_anime_folder.iterdir():
                new_file_name = file.name.replace(
                    f"S{parsed_season}E",
                    f"S{new_parsed_season}E",
                )
                new_file_path = file.with_name(new_file_name)
                file.rename(new_file_path)

    logger.info(f"Ordering {franchise_id} done")

    stream_add_event(franchise_id, "ordering_done")

    logger.info(f"Deleting ordering key: {ordering_key}")
    redis_db.delete(ordering_key)
