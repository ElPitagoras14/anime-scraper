from databases.postgres import Episode as EpisodeModel
from utils.utils import convert_to_local

from .responses import (
    Anime,
    AnimeCard,
    AnimeCardList,
    AnimeList,
    AnimeStreamingLinks,
    AnimeCache,
    AnimeCacheList,
    DownloadJob,
    DownloadJobList,
    Episode,
    DownloadJobInfo,
    EpisodeDownloadInfo,
    EpisodeDownloadList,
    Statistics,
)


def parse_episode_range(episodes_range):
    episodes = []
    ranges = episodes_range.split(",")
    seen = set()
    for item in ranges:
        if "-" in item:
            start, end = map(int, item.split("-"))
            if start < 1 or end < 1:
                continue
            for episode_num in range(start, end + 1):
                if episode_num not in seen:
                    episodes.append(episode_num)
                    seen.add(episode_num)
        else:
            parts = item.split()
            for part in parts:
                episode_num = int(part)
                if episode_num >= 1 and episode_num not in seen:
                    episodes.append(episode_num)
                    seen.add(episode_num)
    return episodes


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
            Episode(
                id=episode.id,
                name=episode.name,
                link=episode.link,
                episode_id=episode.episode_id,
            )
            for episode in streaming_links
        ],
        total=len(streaming_links),
    )


def cast_download_job(item: list):
    return DownloadJob(
        anime=item[0],
        episode=item[1],
        job_id=item[2],
    )


def cast_download_job_list(jobs: list, total: int):
    return DownloadJobList(
        items=[cast_download_job(job) for job in jobs],
        total=total,
    )


def cast_anime_size(anime: str, name: str, size: float):
    return AnimeCache(animeId=anime, name=name, size=size)


def cast_anime_size_list(
    anime_info_list: list[dict], total: int, formated_total_size: str
):
    return AnimeCacheList(
        items=[
            cast_anime_size(anime["anime_id"], anime["name"], anime["size"])
            for anime in anime_info_list
        ],
        size=formated_total_size,
        measured_in="MB",
        total=total,
    )


def cast_to_download_job_info(item: list):
    return DownloadJobInfo(
        job_id=item[0],
        status=item[1],
        progress=item[2],
        total=item[3],
    )


def cast_to_episode_download_info(item: list):
    return EpisodeDownloadInfo(
        episode_id=item[0],
        image=item[1],
        anime=item[2],
        episode_name=item[3],
        created_at=convert_to_local(item[4]),
        status=item[5],
        progress=item[6],
        total=item[7],
        filename=item[8],
    )


def cast_to_episode_download_list(items: list, total: int):
    return EpisodeDownloadList(
        items=[cast_to_episode_download_info(item) for item in items],
        total=total,
    )


def cast_to_statistics(items: list):
    return Statistics(
        animes_saved=items[0],
        episodes_to_download=items[1],
        animes_in_emission=items[2],
    )
