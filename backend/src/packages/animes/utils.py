from datetime import datetime, timezone

from .responses import (
    AnimeDownloadInfo,
    AnimeDownloadInfoList,
    DownloadTaskList,
    DownloadTaskStatus,
    EpisodeDownload,
    EpisodeDownloadList,
    SearchAnimeResult,
    SearchAnimeResultList,
    Anime,
    InEmissionAnime,
    InEmissionAnimeList,
    EpisodeInfo,
    RelatedInfo,
    DownloadTask,
)


def cast_anime_info(anime: dict, saved: dict) -> Anime:
    return Anime(
        id=anime["id"],
        title=anime["title"],
        type=anime["type"],
        poster=anime["poster"],
        is_saved=saved["is_saved"],
        save_date=saved["save_date"],
        season=1,
        other_titles=[title for title in anime["other_titles"]],
        platform="JKAnime",
        description=anime["description"],
        genres=anime["genres"],
        related_info=[
            RelatedInfo(
                id=related["id"], title=related["title"], type=related["type"]
            )
            for related in anime["related_info"]
        ],
        week_day=anime["week_day"],
        is_finished=anime["is_finished"],
        last_scraped_at=datetime.now(timezone.utc),
        last_forced_update=datetime.now(timezone.utc),
        episodes=[
            EpisodeInfo(
                id=episode["id"],
                anime_id=episode["anime_id"],
                image_preview=episode["image_preview"],
                is_downloaded=episode["is_downloaded"],
            )
            for episode in anime["episodes"]
        ],
    )


def cast_search_anime_result(anime: dict) -> SearchAnimeResult:
    return SearchAnimeResult(
        id=anime["id"],
        title=anime["title"],
        type=anime["type"],
        poster=anime["poster"],
        is_saved=anime["is_saved"],
        save_date=anime["save_date"],
    )


def cast_search_anime_result_list(
    animes: list[dict],
) -> SearchAnimeResultList:
    return SearchAnimeResultList(
        items=[cast_search_anime_result(anime) for anime in animes],
        total=len(animes),
    )


def cast_in_emission_anime(anime: dict) -> InEmissionAnime:
    return InEmissionAnime(
        id=anime["id"],
        title=anime["title"],
        type=anime["type"],
        poster=anime["poster"],
        is_saved=anime["is_saved"],
        save_date=anime["save_date"],
        week_day=anime["week_day"],
    )


def cast_in_emission_anime_list(
    animes: list[dict],
) -> InEmissionAnimeList:
    return InEmissionAnimeList(
        items=[cast_in_emission_anime(anime) for anime in animes],
        total=len(animes),
    )


def cast_job_id(job_id: str) -> DownloadTask:
    return DownloadTask(job_id=job_id)


def cast_episode_download(episode_download: dict) -> EpisodeDownload:
    return EpisodeDownload(
        id=episode_download["id"],
        anime_id=episode_download["anime_id"],
        title=episode_download["title"],
        episode_number=episode_download["episode_number"],
        poster=episode_download["poster"],
        job_id=episode_download["job_id"],
        size=episode_download["size"],
        status=episode_download["status"],
        downloaded_at=episode_download["downloaded_at"],
    )


def cast_episode_download_list(
    episode_downloads: list[dict],
    total: int,
) -> EpisodeDownloadList:
    return EpisodeDownloadList(
        items=[
            cast_episode_download(episode_download)
            for episode_download in episode_downloads
        ],
        total=total,
    )


def cast_download_task(download_task: dict) -> DownloadTaskStatus:
    return DownloadTaskStatus(
        job_id=download_task["job_id"],
        episode_number=download_task["episode_number"],
        success=download_task["success"],
    )


def cast_download_task_list(
    download_tasks: list[dict],
    total: int,
) -> DownloadTaskList:
    return DownloadTaskList(
        items=[
            cast_download_task(download_task)
            for download_task in download_tasks
        ],
        total=total,
    )


def cast_anime_download_info(anime: dict) -> AnimeDownloadInfo:
    return AnimeDownloadInfo(
        id=anime["id"],
        title=anime["title"],
    )


def cast_downloaded_anime_list(
    animes: list[dict],
    total: int,
) -> AnimeDownloadInfoList:
    return AnimeDownloadInfoList(
        items=[cast_anime_download_info(anime) for anime in animes],
        total=total,
    )
