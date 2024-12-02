from databases.postgres import Episode as EpisodeModel

from .responses import (
    Anime,
    AnimeCard,
    AnimeCardList,
    AnimeDownloadLink,
    AnimeDownloadLinkList,
    AnimeList,
    AnimeStreamingLinks,
    Link,
    AnimeCache,
    AnimeCacheList,
)


def cast_anime_info(
    anime_id: str,
    name: str,
    image: str,
    is_finished: bool,
    description: str,
    week_day: str,
    is_saved: bool = False,
):
    return Anime(
        anime_id=anime_id,
        name=name,
        is_finished=is_finished,
        description=description,
        image=image,
        week_day=week_day,
        is_saved=is_saved,
    )


def cast_anime_info_list(anime_list: list[dict]):
    return AnimeList(
        items=[
            cast_anime_info(
                anime["id"],
                anime["name"],
                anime["img"],
                anime["is_finished"],
                anime["description"],
                anime["week_day"],
                anime["is_saved"],
            )
            for anime in anime_list
        ],
        total=len(anime_list),
    )


def cast_anime_card_list(anime_card_list: list[dict]):
    return AnimeCardList(
        items=[
            AnimeCard(
                name=anime["name"],
                image=anime["cover_url"],
                anime_id=anime["anime_id"],
                is_saved=anime["is_saved"],
            )
            for anime in anime_card_list
        ],
        total=len(anime_card_list),
    )


def cast_anime_streaming_links(
    anime_name: str, streaming_links: list[EpisodeModel]
):
    return AnimeStreamingLinks(
        name=anime_name,
        items=[
            EpisodeModel(
                name=episode.name,
                link=episode.link,
                episode_id=episode.episode_id,
            )
            for episode in streaming_links
        ],
        total=len(streaming_links),
    )


def cast_single_anime_download_link(
    name: str, download_info: str, episode_id: int
):
    link = (
        Link(
            service=download_info["service"],
            link=download_info["link"],
        )
        if download_info
        else None
    )
    return AnimeDownloadLink(
        name=name,
        download_info=link,
        episode_id=episode_id,
    )


def cast_anime_download_links(download_links: dict):
    return AnimeDownloadLinkList(
        name=download_links["anime"],
        items=[
            cast_single_anime_download_link(
                episode["name"],
                episode["download_info"],
                episode["episode"],
            )
            for episode in download_links["download_links"]
        ],
        total=len(download_links["download_links"]),
    )


def cast_anime_size(anime: str, name: str, size: float):
    return AnimeCache(animeId=anime, name=name, size=size)


def cast_anime_size_list(anime_info_list: list[dict]):
    return AnimeCacheList(
        items=[
            cast_anime_size(anime["anime_id"], anime["name"], anime["size"])
            for anime in anime_info_list
        ],
        size=sum([anime["size"] for anime in anime_info_list]),
        measured_in="KB",
        total=len(anime_info_list),
    )
