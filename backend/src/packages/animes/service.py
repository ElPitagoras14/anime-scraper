from datetime import datetime, timezone, timedelta
import os
from ani_scrapy.async_api import JKAnimeScraper
from loguru import logger
from sqlalchemy import desc
from starlette import status

from worker import celery_app
from utils.exceptions import NotFoundException, ConflictException
from databases.postgres import (
    DatabaseSession,
    Anime,
    Genre,
    AnimeRelation,
    Episode,
    OtherTitle,
    UserSaveAnime,
    UserDownloadEpisode,
    related_types_id,
)
from .utils import (
    cast_download_task_list,
    cast_downloaded_anime_list,
    cast_episode_download_list,
    cast_in_emission_anime_list,
    cast_job_id,
    cast_search_anime_result_list,
    cast_anime_info,
)
from .config import anime_settings

scraper = JKAnimeScraper(verbose=True, level="DEBUG")
ANIMES_FOLDER = anime_settings.ANIMES_FOLDER


def get_anime_info_to_dict(
    anime_db: Anime,
    downloaded_user_episodes_ids: list[int],
    downloaded_global_episodes_ids: list[int],
) -> dict:
    return {
        "id": anime_db.id,
        "title": anime_db.title,
        "type": anime_db.type,
        "poster": anime_db.poster,
        "season": anime_db.season,
        "other_titles": [title.name for title in anime_db.other_titles],
        "description": anime_db.description,
        "genres": [genre.name for genre in anime_db.genres],
        "related_info": [
            {
                "id": related.related_anime.id,
                "title": related.related_anime.title,
                "type": related.type_related.name,
            }
            for related in anime_db.relations
        ],
        "week_day": anime_db.week_day,
        "is_finished": anime_db.is_finished,
        "last_scraped_at": anime_db.last_scraped_at,
        "last_forced_update": anime_db.last_forced_update,
        "episodes": [
            {
                "id": episode.ep_number,
                "anime_id": episode.anime_id,
                "image_preview": episode.preview,
                "is_user_downloaded": episode.id
                in downloaded_user_episodes_ids,
                "is_global_downloaded": episode.id
                in downloaded_global_episodes_ids,
            }
            for episode in anime_db.episodes
        ],
    }


async def add_new_anime(db: DatabaseSession, base_url: str, anime_id: str):
    logger.debug(f"Adding anime to database: {anime_id}")
    anime_info = await scraper.get_anime_info(anime_id, tab_timeout=300)
    week_day = None
    if anime_info.next_episode_date:
        week_day = anime_info.next_episode_date.strftime("%A")

    new_anime = Anime(
        id=anime_info.id,
        title=anime_info.title,
        description=anime_info.synopsis,
        poster=anime_info.poster,
        type=anime_info.type.value,
        is_finished=anime_info.is_finished,
        week_day=week_day,
        last_scraped_at=datetime.now(timezone.utc),
        last_forced_update=datetime.now(timezone.utc),
    )
    db.add(new_anime)
    db.flush()
    logger.debug(f"Added anime to database: {anime_info.id}")

    for genre in anime_info.genres:
        new_genre = Genre(
            anime_id=anime_info.id,
            name=genre,
        )
        db.add(new_genre)

    logger.debug("Added genres to database")

    for related in anime_info.related_info:
        check_related = db.query(Anime).where(Anime.id == related.id).first()
        if not check_related:
            new_dummy_anime = Anime(
                id=related.id,
                title=related.title,
            )
            db.add(new_dummy_anime)
            db.flush()
        new_anime_relation = AnimeRelation(
            anime_id=anime_info.id,
            related_anime_id=related.id,
            type_related_id=related_types_id[related.type.value],
        )
        db.add(new_anime_relation)

    logger.debug("Added related animes to database")

    for title in anime_info.other_titles:
        new_title = OtherTitle(
            anime_id=anime_info.id,
            name=title,
        )
        db.add(new_title)

    for episode in anime_info.episodes:
        new_episode = Episode(
            anime_id=anime_info.id,
            ep_number=episode.id,
            preview=episode.image_preview,
            url=f"{base_url}/{episode.id}",
        )
        db.add(new_episode)
    db.flush()

    logger.debug("Added episodes to database")


async def get_anime_controller(
    anime_id: str, user_id: str, force_update: bool
) -> tuple[int, dict]:
    logger.debug(f"Getting anime with id: {anime_id}")
    base_url = f"https://jkanime.net/{anime_id}"
    with DatabaseSession() as db:
        anime_db = db.query(Anime).where(Anime.id == anime_id).first()
        if not anime_db:
            await add_new_anime(db, base_url, anime_id)
        else:
            if not anime_db.last_scraped_at:
                logger.debug("Dummy anime inserted, updating")
                anime_info = await scraper.get_anime_info(
                    anime_id, tab_timeout=300
                )
                week_day = None
                if anime_info.next_episode_date:
                    week_day = anime_info.next_episode_date.strftime("%A")

                anime_db.description = anime_info.synopsis
                anime_db.poster = anime_info.poster
                anime_db.type = anime_info.type.value
                anime_db.last_scraped_at = datetime.now(timezone.utc)
                anime_db.last_forced_update = datetime.now(timezone.utc)
                anime_db.is_finished = anime_info.is_finished
                anime_db.week_day = week_day

                db.add(anime_db)
                logger.debug(f"Added anime to database: {anime_info.id}")

                for genre in anime_info.genres:
                    new_genre = Genre(
                        anime_id=anime_info.id,
                        name=genre,
                    )
                    db.add(new_genre)

                for related in anime_info.related_info:
                    check_related = (
                        db.query(Anime).where(Anime.id == related.id).first()
                    )
                    if not check_related:
                        new_dummy_anime = Anime(
                            id=related.id,
                            title=related.title,
                        )
                        db.add(new_dummy_anime)
                        db.flush()
                    new_anime_relation = AnimeRelation(
                        anime_id=anime_info.id,
                        related_anime_id=related.id,
                        type_related_id=related_types_id[related.type.value],
                    )
                    db.add(new_anime_relation)

                logger.debug("Added genres and related animes to database")

                for episode in anime_info.episodes:
                    new_episode = Episode(
                        anime_id=anime_info.id,
                        ep_number=episode.id,
                        preview=episode.image_preview,
                        url=f"{base_url}/{episode.id}",
                    )
                    db.add(new_episode)
                db.flush()
                logger.debug("Added episodes to database")

            logger.debug(f"Found anime in database: {anime_db.id}")

            last_scraped_at = anime_db.last_scraped_at
            last_scraped_at_aware = last_scraped_at.replace(
                tzinfo=timezone.utc
            )
            current_time = datetime.now(timezone.utc)

            if force_update or last_scraped_at_aware < (
                current_time - timedelta(hours=1)
            ):
                logger.debug("Old anime info, updating")
                anime = await scraper.get_anime_info(anime_id)
                anime_db.last_scraped_at = current_time
                anime_db.last_forced_update = current_time
                anime_db.is_finished = anime.is_finished

                num_anime_episodes = len(anime.episodes)
                num_db_episodes = len(anime_db.episodes)

                if num_anime_episodes > num_db_episodes:
                    logger.debug("Updating episodes")
                    for idx in range(num_db_episodes, num_anime_episodes):
                        episode = anime.episodes[idx]
                        new_episode = Episode(
                            anime_id=anime_id,
                            ep_number=episode.id,
                            preview=episode.image_preview,
                            url=f"{base_url}/{episode.id}",
                        )
                        db.add(new_episode)
                    db.flush()
                    logger.debug("Added episodes to database")

        anime_db = db.query(Anime).where(Anime.id == anime_id).first()
        saved_anime = (
            db.query(UserSaveAnime)
            .where(
                UserSaveAnime.user_id == user_id,
                UserSaveAnime.anime_id == anime_id,
            )
            .first()
        )
        episode_ids = [episode.id for episode in anime_db.episodes]
        downloaded_user_episodes = (
            db.query(UserDownloadEpisode)
            .filter(
                UserDownloadEpisode.user_id == user_id,
                UserDownloadEpisode.episode_id.in_(episode_ids),
            )
            .all()
        )
        downloaded_user_episodes_ids = [
            episode_download.episode_id
            for episode_download in downloaded_user_episodes
        ]
        downloaded_global_epusodes = (
            db.query(UserDownloadEpisode)
            .filter(
                UserDownloadEpisode.episode_id.in_(episode_ids),
            )
            .all()
        )
        downloaded_global_episodes_ids = [
            episode_download.episode_id
            for episode_download in downloaded_global_epusodes
        ]
        saved_anime_info = {
            "is_saved": saved_anime is not None,
            "save_date": saved_anime.created_at if saved_anime else None,
        }
        new_anime_info = get_anime_info_to_dict(
            anime_db,
            downloaded_user_episodes_ids,
            downloaded_global_episodes_ids,
        )
        casted_anime = cast_anime_info(new_anime_info, saved_anime_info)
        return status.HTTP_200_OK, casted_anime


async def search_anime_controller(query: str, user_id: str):
    logger.debug(f"Searching for {query}")
    animes = await scraper.search_anime(query)
    logger.debug(f"Found {len(animes.animes)} animes")

    with DatabaseSession() as db:
        saved_animes = (
            db.query(UserSaveAnime)
            .where(UserSaveAnime.user_id == user_id)
            .all()
        )
        saved_ids = [anime.anime_id for anime in saved_animes]

        search_animes = [
            {
                "id": anime.id,
                "title": anime.title,
                "type": anime.type.value,
                "poster": anime.poster,
                "is_saved": anime.id in saved_ids,
                "save_date": (
                    saved_animes[saved_ids.index(anime.id)].created_at
                    if anime.id in saved_ids
                    else None
                ),
            }
            for anime in animes.animes
        ]

        casted_animes = cast_search_anime_result_list(search_animes)
        return status.HTTP_200_OK, casted_animes


async def get_saved_animes_controller(user_id: str) -> tuple[int, dict]:
    logger.debug("Getting saved animes")
    with DatabaseSession() as db:
        animes_db = (
            db.query(UserSaveAnime)
            .where(UserSaveAnime.user_id == user_id)
            .all()
        )

        animes = [
            {
                "id": anime.anime.id,
                "title": anime.anime.title,
                "type": anime.anime.type,
                "poster": anime.anime.poster,
                "is_saved": True,
                "save_date": anime.anime.created_at,
            }
            for anime in animes_db
        ]

        casted_animes = cast_search_anime_result_list(animes)
        return status.HTTP_200_OK, casted_animes


async def save_anime_controller(
    anime_id: str, user_id: str
) -> tuple[int, str]:
    logger.debug(f"Saving anime with id: {anime_id}")
    base_url = f"https://jkanime.net/{anime_id}"
    with DatabaseSession() as db:
        anime_db = db.query(Anime).where(Anime.id == anime_id).first()
        if not anime_db:
            await add_new_anime(db, base_url, anime_id)
        new_saved_anime = UserSaveAnime(
            user_id=user_id,
            anime_id=anime_id,
        )
        db.add(new_saved_anime)
        db.flush()
        logger.debug(f"Saved anime with id: {anime_id}")

        return status.HTTP_200_OK, "Anime saved successfully"


async def unsave_anime_controller(
    anime_id: str, user_id: str, request_id: str
) -> tuple[int, str]:
    logger.debug(f"Unsaving anime with id: {anime_id}")
    with DatabaseSession() as db:
        anime_db = db.query(Anime).where(Anime.id == anime_id).first()
        if not anime_db:
            logger.debug(f"Anime with id: {anime_id} not found")
            raise NotFoundException("Anime not found", request_id=request_id)
        saved_anime = (
            db.query(UserSaveAnime)
            .where(
                UserSaveAnime.user_id == user_id,
                UserSaveAnime.anime_id == anime_id,
            )
            .first()
        )
        if not saved_anime:
            logger.debug(f"Saved anime with id: {anime_id} not found")
            raise NotFoundException("Anime not found", request_id=request_id)
        db.delete(saved_anime)
        logger.debug(f"Unsaved anime with id: {anime_id}")

        return status.HTTP_200_OK, "Anime unsaved successfully"


async def get_in_emission_animes_controller(user_id: str) -> tuple[int, dict]:
    logger.debug("Getting in-emission animes")
    with DatabaseSession() as db:
        animes_db = (
            db.query(UserSaveAnime)
            .join(UserSaveAnime.anime)
            .where(
                UserSaveAnime.user_id == user_id, Anime.week_day.isnot(None)
            )
            .all()
        )
        animes = [
            {
                "id": anime.anime.id,
                "title": anime.anime.title,
                "type": anime.anime.type,
                "poster": anime.anime.poster,
                "is_saved": True,
                "save_date": anime.anime.created_at,
                "week_day": anime.anime.week_day,
            }
            for anime in animes_db
            if anime.anime.week_day
        ]

        casted_animes = cast_in_emission_anime_list(animes)
        return status.HTTP_200_OK, casted_animes


async def get_downloads_controller(
    user_id: str, anime_id: str | None = None, limit: int = 10, page: int = 1
) -> tuple[int, dict]:
    logger.debug("Getting downloads")

    with DatabaseSession() as db:
        raw_downloads = db.query(UserDownloadEpisode).filter(
            UserDownloadEpisode.user_id == user_id
        )

        if anime_id:
            raw_downloads = (
                raw_downloads.join(UserDownloadEpisode.episode)
                .join(Episode.anime)
                .filter(Anime.id == anime_id)
            )

        count = raw_downloads.count()
        downloads = (
            raw_downloads.order_by(desc(UserDownloadEpisode.created_at))
            .offset((page - 1) * limit)
            .limit(limit)
        ).all()

        episode_downloads = [
            {
                "id": episode.episode_id,
                "anime_id": episode.episode.anime_id,
                "title": episode.episode.anime.title,
                "episode_number": episode.episode.ep_number,
                "poster": episode.episode.anime.poster,
                "job_id": episode.episode.job_id,
                "size": episode.episode.size,
                "status": episode.episode.status,
                "downloaded_at": episode.created_at,
            }
            for episode in downloads
        ]

        casted_episode_downloads = cast_episode_download_list(
            episode_downloads, count
        )

    return status.HTTP_200_OK, casted_episode_downloads


async def get_downloaded_animes_controller(user_id: str) -> tuple[int, dict]:
    logger.debug("Getting downloaded animes")

    with DatabaseSession() as db:
        episode_downloads = (
            db.query(UserDownloadEpisode)
            .filter(UserDownloadEpisode.user_id == user_id)
            .all()
        )
        anime_ids = [
            episode_download.episode.anime_id
            for episode_download in episode_downloads
        ]

        animes = db.query(Anime).filter(Anime.id.in_(anime_ids)).all()
        animes_info = [
            {
                "id": anime.id,
                "title": anime.title,
            }
            for anime in animes
        ]

        casted_animes = cast_downloaded_anime_list(animes_info, len(animes))
        return status.HTTP_200_OK, casted_animes


async def get_download_episode_controller(episode_id: int) -> tuple[int, dict]:
    logger.debug(f"Getting download episode with id: {episode_id}")
    with DatabaseSession() as db:
        episode = (
            db.query(Episode)
            .filter(
                Episode.id == episode_id,
            )
            .first()
        )
        if not episode:
            return status.HTTP_404_NOT_FOUND, "Episode not found"

        parsed_season = str(episode.anime.season).zfill(2)
        anime_folder = (
            f"{ANIMES_FOLDER}/{episode.anime_id}/Season {parsed_season}"
        )
        if not os.path.exists(anime_folder):
            return status.HTTP_404_NOT_FOUND, "Episode not found"

        parsed_episode_number = str(episode.ep_number).zfill(2)
        file_path = (
            f"{anime_folder}/{episode.anime_id} - S{parsed_season}E"
            + f"{parsed_episode_number}.mp4"
        )

        casted_data = {
            "path": file_path,
            "filename": f"{episode.anime_id}-{episode.ep_number}.mp4",
        }

        return status.HTTP_200_OK, casted_data


async def download_anime_controller(
    anime_id: str,
    episode_number: int,
    force_download: bool,
    user_id: str,
    request_id: str,
) -> tuple[int, str]:
    logger.debug(f"Downloading anime with id: {anime_id} - {episode_number}")

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
            raise NotFoundException("Episode not found", request_id=request_id)

        download = (
            db.query(UserDownloadEpisode)
            .filter(
                UserDownloadEpisode.user_id == user_id,
                UserDownloadEpisode.episode_id == episode.id,
            )
            .first()
        )
        if download and not force_download:
            raise ConflictException(
                "Download already in progress", request_id=request_id
            )

        general_download = (
            db.query(UserDownloadEpisode)
            .filter(
                UserDownloadEpisode.episode_id == episode.id,
            )
            .first()
        )
        if general_download and not force_download:
            return status.HTTP_201_CREATED, cast_job_id(
                general_download.episode.job_id
            )

        result = celery_app.send_task(
            "tasks.download_anime",
            args=[anime_id, episode_number, user_id, request_id],
        )

        if not force_download:
            new_download = UserDownloadEpisode(
                user_id=user_id,
                episode_id=episode.id,
            )
            db.add(new_download)

        episode.job_id = result.id
        episode.status = "PENDING"
        db.add(episode)

        logger.debug(f"Enqueued download with job id: {result.id}")

        return status.HTTP_201_CREATED, cast_job_id(result.id)


async def download_anime_bulk_controller(
    anime_id: str, episode_numbers: list[int], user_id: str, request_id: str
) -> tuple[int, list[dict]]:
    logger.debug(f"Downloading anime with id: {anime_id}")
    success_enqueued = []
    failed_enqueued = []
    with DatabaseSession() as db:
        for ep_number in episode_numbers:
            print(ep_number, anime_id)
            try:
                episode = (
                    db.query(Episode)
                    .filter(
                        Episode.anime_id == anime_id,
                        Episode.ep_number == ep_number,
                    )
                    .first()
                )
                if not episode:
                    raise NotFoundException(
                        "Episode not found", request_id=request_id
                    )

                episode_download = (
                    db.query(UserDownloadEpisode)
                    .filter(
                        UserDownloadEpisode.episode_id == episode.id,
                        UserDownloadEpisode.user_id == user_id,
                    )
                    .first()
                )
                if episode_download:
                    logger.warning(
                        f"Episode {episode.id} already enqueued for "
                        + f"user {user_id}"
                    )
                    failed_enqueued.append([None, ep_number])
                    continue

                new_download = UserDownloadEpisode(
                    episode_id=episode.id, user_id=user_id
                )
                db.add(new_download)

                episode.status = "PENDING"
                db.add(episode)

                result = celery_app.send_task(
                    "tasks.download_anime",
                    args=[anime_id, episode.ep_number, user_id, request_id],
                )
                logger.debug(f"Enqueued download with job id: {result.id}")

                episode.job_id = result.id
                db.add(episode)
                db.commit()
                success_enqueued.append([result.id, ep_number])
            except Exception as e:
                logger.error(f"Error downloading episode: {e}")
                failed_enqueued.append([None, ep_number])

        parsed_data = []
        for success in success_enqueued:
            parsed_data.append(
                {
                    "job_id": success[0],
                    "episode_number": success[1],
                    "success": True,
                }
            )
        for failed in failed_enqueued:
            parsed_data.append(
                {
                    "job_id": failed[0],
                    "episode_number": failed[1],
                    "success": False,
                }
            )
        casted_data = cast_download_task_list(parsed_data, len(parsed_data))
        return status.HTTP_201_CREATED, casted_data
