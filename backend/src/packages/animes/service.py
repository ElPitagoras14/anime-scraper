import base64
import aiohttp
import os
from celery.result import AsyncResult
from loguru import logger
from datetime import datetime, timedelta, timezone
from bs4 import BeautifulSoup
from sqlalchemy import exists, text

from databases.postgres import (
    DatabaseSession,
    Anime,
    Episode,
    User,
    UserSaveAnime,
    UserDownloadEpisode,
)
from libraries.anime_scraper import ScraperFactory
from utils.utils import convert_size, format_size
from queues import enqueue_episode_download_link_process, celery_app

from .utils import (
    cast_anime_card_list,
    cast_anime_info,
    cast_anime_info_list,
    cast_anime_size_list,
    cast_anime_streaming_links,
    cast_download_job,
    cast_download_job_list,
    cast_to_download_job_info,
    cast_to_episode_download_list,
    cast_to_statistics,
    parse_episode_range,
)

scraper = ScraperFactory.get_scraper("animeflv")


def get_last_weekday(target_weekday: str) -> datetime:
    if not target_weekday:
        return None
    weekdays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]
    today = datetime.now(timezone.utc)
    days_difference = (today.weekday() - weekdays.index(target_weekday)) % 7
    return today - timedelta(days=days_difference)


def get_anime_cards(page: str):
    soup = BeautifulSoup(page, "html.parser")
    anime_list = []
    anime_container = soup.find_all(
        "ul", class_="ListAnimes AX Rows A03 C02 D02"
    )[0].find_all("li")
    for anime in anime_container:
        name = anime.find("h3").text
        anime_id = anime.find("a")["href"].split("/")[-1]
        cover = anime.find("img")["src"]
        cover_url = cover
        anime_list.append(
            {"name": name, "cover_url": cover_url, "anime_id": anime_id}
        )
    return anime_list


def get_is_saved_anime_list(anime_list: list, user_id: str):
    logger.debug("Getting saved animes")
    with DatabaseSession() as db:
        anime_names = [anime["name"] for anime in anime_list]
        saved_animes = (
            db.query(Anime)
            .join(UserSaveAnime, Anime.id == UserSaveAnime.anime_id)
            .join(User, User.id == UserSaveAnime.user_id)
            .filter(User.id == user_id)
            .filter(Anime.name.in_(anime_names))
            .all()
        )
        animes_saved_list = []
        for anime in anime_list:
            is_saved = False
            for saved_anime in saved_animes:
                if anime["name"] == saved_anime.name:
                    is_saved = True
                    break
            animes_saved_list.append({**anime, "is_saved": is_saved})
        return animes_saved_list


async def img_link_to_b64(img_link: str):
    b64_image = None
    async with aiohttp.ClientSession() as session:
        async with session.get(img_link, allow_redirects=True) as response:
            cover_data = await response.read()
            b64_image = base64.b64encode(cover_data).decode("utf-8")
    return b64_image


async def get_anime_info_controller(anime: str, user_id: str):
    logger.debug(f"Getting anime info for {anime}")
    anime_info = None
    with DatabaseSession() as db:
        anime_info = db.query(Anime).filter(Anime.id == anime).first()
        is_saved = db.query(
            exists()
            .where(UserSaveAnime.anime_id == anime)
            .where(UserSaveAnime.user_id == user_id)
        ).scalar()

        anime_week_day = None
        if anime_info:
            anime_is_finished = anime_info.is_finished
            anime_week_day = anime_info.week_day
            anime_last_peek = anime_info.last_peek
            today = datetime.now(timezone.utc)
            today_weekday = today.strftime("%A")

            anime_info.last_peek = datetime.now(timezone.utc)
            last_weekday = get_last_weekday(anime_week_day)

            if (
                anime_is_finished
                or not anime_week_day
                or (
                    anime_week_day != today_weekday
                    and anime_last_peek.replace(tzinfo=timezone.utc)
                    >= last_weekday
                )
            ):
                logger.info(f"Found anime {anime} in cache database")
                anime_response = cast_anime_info(
                    anime_info.id,
                    anime_info.name,
                    anime_info.img,
                    anime_info.is_finished,
                    anime_info.description,
                    anime_info.week_day,
                    is_saved,
                )
                return anime_response

        scraper_anime_info = await scraper.get_anime_info(anime)
        is_finished = scraper_anime_info["is_finished"]
        name = scraper_anime_info["name"]
        description = scraper_anime_info["description"]
        raw_img = scraper_anime_info["cover_url"]
        b64_image = await img_link_to_b64(raw_img)

        if anime_info:
            if is_finished:
                anime_info.is_finished = True
                anime_info.week_day = None
            anime_response = cast_anime_info(
                anime,
                name,
                b64_image,
                is_finished,
                description,
                anime_week_day,
                is_saved,
            )
            logger.info(f"Updated anime {anime} in cache database")

            db.commit()
            db.refresh(anime_info)

        else:
            new_week_day = None
            if not is_finished:
                new_week_day = await scraper.get_emission_date(anime)
            new_anime = Anime(
                id=anime,
                name=name,
                description=description,
                img=b64_image,
                is_finished=is_finished,
                week_day=new_week_day,
                last_peek=datetime.now(timezone.utc),
            )
            db.add(new_anime)
            db.commit()
            db.refresh(new_anime)

            anime_response = cast_anime_info(
                anime,
                name,
                b64_image,
                is_finished,
                description,
                new_week_day,
                is_saved,
            )

        return anime_response


async def search_anime_query_controller(query: str, user_id: str):
    logger.debug(f"Searching anime with query: {query}")
    anime_list = await scraper.search_anime(query)
    anime_list_with_save = get_is_saved_anime_list(anime_list, user_id)
    anime_card_list = cast_anime_card_list(anime_list_with_save)
    logger.info(f"Found {anime_card_list.total} anime with query: {query}")
    return anime_card_list


async def get_streaming_links_controller(
    anime_name: str,
):
    logger.debug(f"Getting streaming links for {anime_name}")
    with DatabaseSession() as db:
        last_episode = None
        anime = db.query(Anime).filter(Anime.id == anime_name).first()
        if not anime:
            return (
                False,
                "Anime not found. Please search the anime info first.",
            )

    with DatabaseSession() as db:
        anime = db.query(Anime).filter(Anime.id == anime_name).first()
        anime_id = anime.id

        last_episode = (
            db.query(Episode)
            .filter(Episode.anime_id == anime_id)
            .order_by(Episode.id.desc())
            .first()
        )
        last_episode_name = last_episode.name if last_episode else None
        new_stream_links = await scraper.get_streaming_links(
            anime_name, last_episode_name
        )

        streaming_links = (
            db.query(Episode)
            .filter(Episode.anime_id == anime_id)
            .order_by(Episode.id)
            .all()
        )
        if new_stream_links:
            stream_to_add = []
            for idx, stream in enumerate(new_stream_links):
                stream_to_add.append(
                    Episode(
                        anime_id=anime_id,
                        episode_id=idx + len(streaming_links) + 1,
                        name=stream["name"],
                        link=stream["link"],
                    )
                )
            db.add_all(stream_to_add)
            db.commit()
            streaming_links += stream_to_add
        logger.info(
            f"Found {len(streaming_links)} streaming links for {anime.name}"
        )
        return True, cast_anime_streaming_links(anime.name, streaming_links)


async def enqueue_range_episodes_download_links_controller(
    episode_links: list[dict], episode_range: str, current_user: dict
):
    range_num = parse_episode_range(episode_range)
    anime_name = "-".join(
        episode_links[0]["link"].split("/")[-1].split("-")[:-1]
    )
    user_id = current_user["sub"]
    jobs = []

    with DatabaseSession() as db:
        for episode_num in range_num:
            episode_info = episode_links[episode_num - 1]
            link = episode_info["link"]
            episode_id = episode_info["id"]
            episode_name = link.split("/")[-1]
            task = enqueue_episode_download_link_process.delay(
                episode_id, link, anime_name
            )
            logger.debug(f"Task with ID {task.id} enqueued")

            episode = (
                db.query(Episode).filter(Episode.id == episode_id).first()
            )
            if episode:
                episode.job_id = task.id
                downloaded_insert = UserDownloadEpisode(
                    episode_id=episode_id, user_id=user_id
                )
                db.add(downloaded_insert)
                db.commit()
                db.refresh(episode)

            jobs.append([anime_name, episode_name, task.id])

    logger.info(f"Enqueued {len(jobs)} download tasks for {anime_name}")
    return cast_download_job_list(jobs, len(jobs))


async def force_re_download_controller(episode_id: int):
    with DatabaseSession() as db:
        episode = db.query(Episode).filter(Episode.id == episode_id).first()
        if not episode:
            return None

        if episode.file_path:
            episode.file_path = None
            db.commit()

        return await enqueue_single_episode_download_links_controller(
            episode.link, episode_id, force=True
        )


async def enqueue_single_episode_download_links_controller(
    episode_link: str,
    episode_id: int,
    user_id: str = None,
    force: bool = False,
):
    logger.debug(f"Enqueuing download link for {episode_link}")
    with DatabaseSession() as db:
        if not force:
            same_episode = (
                db.query(Episode).filter(Episode.id == episode_id).first()
            )
            has_downloaded = (
                db.query(UserDownloadEpisode)
                .filter(UserDownloadEpisode.episode_id == episode_id)
                .filter(UserDownloadEpisode.user_id == user_id)
                .first()
            )
            if same_episode.file_path or same_episode.job_id:
                if not has_downloaded:
                    downloaded_insert = UserDownloadEpisode(
                        episode_id=episode_id, user_id=user_id
                    )
                    db.add(downloaded_insert)
                    db.commit()
                return 201

        anime_name = "-".join(episode_link.split("/")[-1].split("-")[:-1])
        episode_name = episode_link.split("/")[-1]
        task = enqueue_episode_download_link_process.delay(
            episode_id, episode_link, anime_name
        )
        logger.info(f"Task with ID {task.id} enqueued")

        episode = db.query(Episode).filter(Episode.id == episode_id).first()
        if episode:
            episode.job_id = task.id
            if not force:
                downloaded_insert = UserDownloadEpisode(
                    episode_id=episode_id, user_id=user_id
                )
                db.add(downloaded_insert)
            db.commit()
            db.refresh(episode)

    item = [anime_name, episode_name, task.id]
    return cast_download_job(item)


async def get_user_download_episodes_controller(
    page: int, size: int, user_id: dict
):
    logger.debug(f"Getting download episodes for page {page} and size {size}")
    with DatabaseSession() as db:
        episodes_query = (
            db.query(Episode, Anime, UserDownloadEpisode)
            .join(
                UserDownloadEpisode,
                Episode.id == UserDownloadEpisode.episode_id,
            )
            .join(User, User.id == UserDownloadEpisode.user_id)
            .join(Anime, Anime.id == Episode.anime_id)
            .filter(User.id == user_id)
            .filter(Episode.job_id.isnot(None) | Episode.file_path.isnot(None))
            .order_by(UserDownloadEpisode.created_at.desc())
        )

        total = episodes_query.count()

        page = int(page)
        size = int(size)
        if size == -1:
            offset = None
            limit = None
        else:
            offset = page * size
            limit = size

        if offset is not None:
            episodes_query = episodes_query.offset(offset)
        if limit is not None:
            episodes_query = episodes_query.limit(limit)

        episode_list = episodes_query.all()

        if not episode_list:
            return None

        items = []
        for episode, anime, user_download in episode_list:
            filename = f"{anime.id}-{episode.episode_id}.mp4"
            if episode.file_path:
                items.append(
                    [
                        episode.id,
                        anime.img,
                        anime.name,
                        episode.name,
                        user_download.created_at,
                        "DOWNLOADED",
                        100,
                        format_size(episode.size),
                        filename,
                    ]
                )
            else:
                result = AsyncResult(episode.job_id, app=celery_app)
                progress = 0
                if result:
                    info = result.info
                    if info is not None and type(info) is dict:
                        progress = info.get("progress", 0)
                items.append(
                    [
                        episode.id,
                        anime.img,
                        anime.name,
                        episode.name,
                        user_download.created_at,
                        result.state,
                        progress,
                        (
                            format_size(episode.size)
                            if episode.size
                            else "Unknown"
                        ),
                        filename,
                    ]
                )
        return cast_to_episode_download_list(items, total)


async def delete_user_download_episodes_controller(
    user_id: str, episode_id: int
):
    logger.debug(f"Deleting download episode {episode_id}")
    with DatabaseSession() as db:
        download_episode = (
            db.query(UserDownloadEpisode)
            .filter(UserDownloadEpisode.episode_id == episode_id)
            .filter(UserDownloadEpisode.user_id == user_id)
            .first()
        )
        if not download_episode:
            return False

        db.delete(download_episode)
        db.commit()

        references = (
            db.query(UserDownloadEpisode)
            .filter(UserDownloadEpisode.episode_id == episode_id)
            .count()
        )
        if references == 0:
            episode = (
                db.query(Episode).filter(Episode.id == episode_id).first()
            )
            if episode.file_path:
                if os.path.exists(episode.file_path):
                    os.remove(episode.file_path)
            episode.file_path = None
            episode.job_id = None
            db.commit()

    return True


async def get_job_info_controller(job_id: str):
    result = AsyncResult(job_id, app=celery_app)
    if result:
        info = result.info
        progress = 0
        total = "Unknown"
        if info is not None:
            progress = info.get("progress", 0)
            total = info.get("total", "Unknown")
        item = [job_id, result.state, progress, total]
        return cast_to_download_job_info(item)
    return None


async def download_episode_controller(episode_id: int):
    logger.debug(f"Downloading episode {episode_id}")
    with DatabaseSession() as db:
        episode, anime = (
            db.query(Episode, Anime)
            .join(Anime, Anime.id == Episode.anime_id)
            .filter(Episode.id == episode_id)
            .first()
        )
        if not episode:
            return None

        if not episode.file_path:
            return None

        return [episode.file_path, f"{anime.id}-{episode.episode_id}"]


async def get_saved_animes_controller(user_id: str):
    logger.debug("Getting saved animes")
    with DatabaseSession() as db:
        anime_list = (
            db.query(Anime)
            .join(UserSaveAnime, Anime.id == UserSaveAnime.anime_id)
            .join(User, User.id == UserSaveAnime.user_id)
            .filter(User.id == user_id)
            .all()
        )
        anime_list_with_save = [
            {**anime.__dict__, "is_saved": True} for anime in anime_list
        ]
        anime_info_list = cast_anime_info_list(anime_list_with_save)
        logger.info(f"Found {anime_info_list.total} saved animes")
        return anime_info_list


async def save_anime_controller(anime_id: str, user_id: str):
    with DatabaseSession() as db:
        anime = db.query(Anime).filter(Anime.id == anime_id).first()
        if not anime:
            return (
                False,
                "Anime not found. Please search the anime info first.",
            )

    with DatabaseSession() as db:
        anime = db.query(Anime).filter(Anime.id == anime_id).first()
        is_saved = db.query(
            exists()
            .where(UserSaveAnime.user_id == user_id)
            .where(UserSaveAnime.anime_id == anime_id)
        ).scalar()

        if is_saved:
            return True, cast_anime_info(
                anime.id,
                anime.name,
                anime.img,
                anime.is_finished,
                anime.description,
                anime.week_day,
                is_saved=True,
            )

        user_saved_anime = UserSaveAnime(user_id=user_id, anime_id=anime_id)
        db.add(user_saved_anime)
        db.commit()
        return True, cast_anime_info(
            anime.id,
            anime.name,
            anime.img,
            anime.is_finished,
            anime.description,
            anime.week_day,
            is_saved=True,
        )


async def delete_saved_anime_controller(anime_id: str, user_id: str):
    with DatabaseSession() as db:
        anime = db.query(Anime).filter(Anime.id == anime_id).first()
        if not anime:
            await get_anime_info_controller(anime_id, user_id)

    with DatabaseSession() as db:
        anime = db.query(Anime).filter(Anime.id == anime_id).first()
        is_saved = db.query(
            exists()
            .where(UserSaveAnime.user_id == user_id)
            .where(UserSaveAnime.anime_id == anime_id)
        ).scalar()

        if not is_saved:
            return True, cast_anime_info(
                anime.id,
                anime.name,
                anime.img,
                anime.is_finished,
                anime.description,
                anime.week_day,
                is_saved=False,
            )

        user_saved_anime = (
            db.query(UserSaveAnime)
            .filter(UserSaveAnime.user_id == user_id)
            .filter(UserSaveAnime.anime_id == anime_id)
            .first()
        )
        db.delete(user_saved_anime)
        db.commit()
        return True, cast_anime_info(
            anime.id,
            anime.name,
            anime.img,
            anime.is_finished,
            anime.description,
            anime.week_day,
            is_saved=False,
        )


def get_episodes_path(anime_id: str):
    with DatabaseSession() as db:
        episodes_with_file = (
            db.query(Episode)
            .filter(Episode.anime_id == anime_id)
            .filter(Episode.file_path.isnot(None))
            .all()
        )
        if not episodes_with_file:
            return []

        episodes = []
        for episode in episodes_with_file:
            episodes.append(
                {
                    "episode_id": episode.episode_id,
                    "name": episode.name,
                    "file_path": episode.file_path,
                }
            )
        return episodes


async def get_all_animes_cache_controller(
    sort_by: str, desc: bool, page: int, size: int
):
    sort_column = "total_cache_in_b"
    order = "DESC"
    if sort_by is not None:
        sort_column = sort_by
        order = "DESC" if desc else "ASC"

    with DatabaseSession() as db:
        count_query = text(
            """
            SELECT
                COUNT(*)
            FROM
                animes
            """
        )
        total = db.execute(count_query).fetchone()[0]
        query = text(
            f"""
            WITH
            serie_cache AS (
                SELECT
                    a.id,
                    a.name,
                    SUM(pg_column_size(a)) AS cache_in_b
                FROM
                    animes a
                GROUP BY a.id
            ),
            episodes_cache AS (
                SELECT
                    e.anime_id,
                    SUM(pg_column_size(e)) AS cache_in_b
                FROM
                    episodes e
                GROUP BY e.anime_id
            )
            SELECT
                serie_cache.id,
                serie_cache.name,
                COALESCE(serie_cache.cache_in_b, 0)
                + COALESCE(episodes_cache.cache_in_b, 0) AS total_cache_in_b
            FROM
                serie_cache
            LEFT JOIN
                episodes_cache
            ON
                serie_cache.id = episodes_cache.anime_id
            ORDER BY {sort_column} {order}
            {f"LIMIT {size} OFFSET {size * page}" if size != -1 else ""};
            """
        )
        results = db.execute(query).fetchall()

        clean_results = []
        total_size = 0
        for res in results:
            anime_id = res[0]
            episodes_with_file = get_episodes_path(anime_id)

            episodes_size = 0
            for episode in episodes_with_file:
                path = episode["file_path"]
                if not os.path.exists(path):
                    continue
                episodes_size += os.path.getsize(path)

            clean_results.append(
                {
                    "anime_id": res[0],
                    "name": res[1],
                    "size": res[2] + episodes_size,
                }
            )
            total_size += res[2] + episodes_size

        formated_results = []
        for res in clean_results:
            formated_results.append(
                {
                    "anime_id": res["anime_id"],
                    "name": res["name"],
                    "size": float(convert_size(res["size"], "MB")[:-3]),
                }
            )
        sorted_results = sorted(
            formated_results, key=lambda x: x["size"], reverse=(not desc)
        )

        formated_total_size = convert_size(total_size, "MB")

        return cast_anime_size_list(sorted_results, total, formated_total_size)


async def delete_anime_cache_controller(anime_id: str):
    logger.debug(f"Deleting anime {anime_id} from cache database")
    with DatabaseSession() as db:
        episodes_with_job = (
            db.query(Episode)
            .filter(Episode.anime_id == anime_id)
            .filter(Episode.job_id.isnot(None))
            .all()
        )

        for episode in episodes_with_job:
            celery_app.control.revoke(
                episode.job_id, terminate=True, signal="SIGKILL"
            )

        episodes_with_file = (
            db.query(Episode)
            .filter(Episode.anime_id == anime_id)
            .filter(Episode.file_path.isnot(None))
            .all()
        )

        for episode in episodes_with_file:
            if os.path.exists(episode.file_path):
                os.remove(episode.file_path)

        anime = db.query(Anime).filter(Anime.id == anime_id).first()
        if not anime:
            return False, "Anime not found in cache database"

        db.delete(anime)
        db.commit()
        return True, "Anime deleted from cache database"


async def get_user_statistics_controller(user_id: str):
    with DatabaseSession() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        animes_saved = (
            db.query(UserSaveAnime)
            .filter(UserSaveAnime.user_id == user_id)
            .count()
        )

        episodes_to_download = (
            db.query(UserDownloadEpisode)
            .filter(UserDownloadEpisode.user_id == user_id)
            .count()
        )

        animes_in_emission = (
            db.query(Anime)
            .join(UserSaveAnime, Anime.id == UserSaveAnime.anime_id)
            .filter(Anime.week_day.isnot(None))
            .filter(UserSaveAnime.user_id == user_id)
            .count()
        )
        item = [animes_saved, episodes_to_download, animes_in_emission]
        return cast_to_statistics(item)
