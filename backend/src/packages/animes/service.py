import base64
from decimal import Decimal
import aiohttp
from loguru import logger
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from sqlalchemy import exists, text

from databases.postgres.models import User
from libraries.animeflv_scraper import (
    get_streaming_links,
    get_single_episode_download_link,
    get_range_episodes_download_links,
    get_emission_date,
)
from databases.postgres import DatabaseSession, Anime, Episode, user_save_anime

from .utils import (
    cast_anime_card_list,
    cast_anime_download_links,
    cast_anime_info,
    cast_anime_info_list,
    cast_anime_size_list,
    cast_anime_streaming_links,
    cast_single_anime_download_link,
)

HOST = "https://www3.animeflv.net"


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


def get_is_saved_anime_list(anime_list: list, current_user: dict):
    with DatabaseSession() as db:
        anime_names = [anime["name"] for anime in anime_list]
        saved_animes = (
            db.query(Anime)
            .join(user_save_anime, Anime.id == user_save_anime.c.anime_id)
            .join(User, User.id == user_save_anime.c.user_id)
            .filter(User.id == current_user["sub"])
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


async def get_anime_info_controller(anime: str, current_user: dict):
    anime_info = None
    with DatabaseSession() as db:
        anime_info = db.query(Anime).filter(Anime.id == anime).first()
        is_saved = db.query(
            exists()
            .where(user_save_anime.c.anime_id == anime)
            .where(user_save_anime.c.user_id == current_user["sub"])
        ).scalar()

        if anime_info:
            anime_is_finished = anime_info.is_finished
            anime_week_day = anime_info.week_day
            anime_last_peek = anime_info.last_peek
            today = datetime.now(timezone.utc)
            today_weekday = today.strftime("%A")

            anime_info.last_peek = datetime.now(timezone.utc)

            if (
                anime_is_finished
                or not anime_week_day
                or anime_week_day != today_weekday
                or (today - anime_last_peek).days > 7
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

        async with aiohttp.ClientSession() as session:
            async with session.get(HOST + f"/anime/{anime}") as response:
                page = await response.text()
                soup = BeautifulSoup(page, "html.parser")
                name = soup.find("h1").text
                cover = soup.find_all("div", class_="AnimeCover")[0].find(
                    "img"
                )["src"]
                cover_url = HOST + cover
                is_finished = soup.find_all("p", class_="AnmStts")[0].text
                is_finished = is_finished == "Finalizado"
                description = soup.find_all("div", class_="Description")[
                    0
                ].text
                parsed_description = description.replace("\n", "").strip()

                b64_image = None
                async with session.get(
                    cover_url, allow_redirects=True
                ) as response:
                    cover_data = await response.read()
                    b64_image = base64.b64encode(cover_data).decode("utf-8")

                week_day = None
                anime_response = None
                new_anime = None
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
                        week_day,
                        is_saved,
                    )
                    logger.info(f"Updated anime {anime} in cache database")

                    db.commit()
                    db.refresh(anime_info)

                else:
                    if not is_finished:
                        week_day = await get_emission_date(anime)
                    new_anime = Anime(
                        id=anime,
                        name=name,
                        description=parsed_description,
                        img=b64_image,
                        is_finished=is_finished,
                        week_day=week_day,
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
                        parsed_description,
                        week_day,
                        is_saved,
                    )
                    logger.info(f"Found anime {anime} in animeflv")

                return anime_response


async def search_anime_query_controller(query: str, current_user: dict):
    async with aiohttp.ClientSession() as session:
        async with session.get(HOST + f"/browse?q={query}") as response:
            page = await response.text()
            soup = BeautifulSoup(page, "html.parser")
            pagination = soup.find_all("div", class_="NvCnAnm")[0]
            total = int(len(pagination.find_all("li"))) - 2
            anime_list = []
            anime_list += get_anime_cards(page)

            if total > 1:
                for i in range(2, total + 1):
                    async with session.get(
                        HOST + f"/browse?q={query}&page={i}"
                    ) as response:
                        page = await response.text()
                        anime_list += get_anime_cards(page)
            anime_list_with_save = get_is_saved_anime_list(
                anime_list, current_user
            )
            anime_card_list = cast_anime_card_list(anime_list_with_save)
            logger.info(
                f"Found {anime_card_list.total} anime with query: {query}"
            )
            return anime_card_list


async def get_streaming_links_controller(anime_name: str):
    print("anime_name", anime_name)
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
        new_stream_links = await get_streaming_links(
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


async def get_range_episodes_download_links_controller(
    episode_links: list[dict],
    episode_range: str,
):
    download_links = await get_range_episodes_download_links(
        episode_links, episode_range
    )
    not_valid_cnt = 0
    for episode in download_links["download_links"]:
        if not episode:
            not_valid_cnt += 1
    logger.info(
        f"Found {len(download_links["download_links"]) - not_valid_cnt} "
        + f"download links for {download_links["anime"]}"
    )
    return cast_anime_download_links(download_links)


async def get_single_episode_download_link_controller(
    episode_link: str, episode_id: int
):
    name = "-".join(episode_link.split("/")[-1].split("-")[:-1])

    download_link = await get_single_episode_download_link(episode_link)

    logger.info(
        f"Found download link for {name} episode {episode_id}: {download_link}"
    )
    if not download_link:
        return None

    return cast_single_anime_download_link(name, download_link, episode_id)


async def get_saved_animes_controller(current_user: dict):
    with DatabaseSession() as db:
        anime_list = (
            db.query(Anime)
            .join(user_save_anime, Anime.id == user_save_anime.c.anime_id)
            .join(User, User.id == user_save_anime.c.user_id)
            .filter(User.id == current_user["sub"])
            .all()
        )
        anime_list_with_save = [
            {**anime.__dict__, "is_saved": True} for anime in anime_list
        ]
        anime_info_list = cast_anime_info_list(anime_list_with_save)
        logger.info(f"Found {anime_info_list.total} saved animes")
        return anime_info_list


async def save_anime_controller(anime_id: str, current_user: dict):
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
            .where(user_save_anime.c.user_id == current_user["sub"])
            .where(user_save_anime.c.anime_id == anime_id)
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

        user_saved_anime = user_save_anime.insert().values(
            user_id=current_user["sub"], anime_id=anime_id
        )
        db.execute(user_saved_anime)
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


async def delete_saved_anime_controller(anime_id: str, current_user: dict):
    with DatabaseSession() as db:
        anime = db.query(Anime).filter(Anime.id == anime_id).first()
        if not anime:
            await get_anime_info_controller(anime_id, current_user)

    with DatabaseSession() as db:
        anime = db.query(Anime).filter(Anime.id == anime_id).first()
        is_saved = db.query(
            exists()
            .where(user_save_anime.c.user_id == current_user["sub"])
            .where(user_save_anime.c.anime_id == anime_id)
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
            user_save_anime.delete()
            .where(user_save_anime.c.user_id == current_user["sub"])
            .where(user_save_anime.c.anime_id == anime_id)
        )
        db.execute(user_saved_anime)
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


async def get_all_animes_cache_controller():
    with DatabaseSession() as db:
        query = text(
            """
            WITH
            serie_cache AS (
                SELECT
                    a.id,
                    a.name,
                    SUM(pg_column_size(a)) / 1024.0 AS cache_in_kb
                FROM
                    animes a
                GROUP BY a.id
            ),
            episodes_cache AS (
                SELECT
                    e.anime_id,
                    SUM(pg_column_size(e)) / 1024.0 AS cache_in_kb
                FROM
                    episodes e
                GROUP BY e.anime_id
            )
            SELECT
                serie_cache.id,
                serie_cache.name,
                COALESCE(serie_cache.cache_in_kb, 0)
                + COALESCE(episodes_cache.cache_in_kb, 0) AS total_cache_in_kb
            FROM
                serie_cache
            LEFT JOIN
                episodes_cache
            ON
                serie_cache.id = episodes_cache.anime_id
            ORDER BY total_cache_in_kb DESC;
            """
        )

        results = db.execute(query).fetchall()
        clean_results = [
            {
                "anime_id": result[0],
                "name": result[1],
                "size": result[2].quantize(Decimal("0.01")),
            }
            for result in results
        ]
        return cast_anime_size_list(clean_results)


async def delete_anime_cache_controller(anime_id: str):
    with DatabaseSession() as db:
        anime = db.query(Anime).filter(Anime.id == anime_id).first()
        if not anime:
            return False, "Anime not found in cache database"

        db.delete(anime)
        db.commit()
        return True, "Anime deleted from cache database"
