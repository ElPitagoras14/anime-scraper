from typing import TypedDict


class SearchAnimeInfo(TypedDict):
    anime_id: str
    name: str
    cover_url: str


class AnimeInfo(TypedDict):
    anime_id: str
    name: str
    cover_url: str
    is_finished: bool
    description: str
    emission_date: str


class StreamingLink(TypedDict):
    link: str
    name: str


class DownloadInfo(TypedDict):
    service: str
    link: str


class DownloadLink(TypedDict):
    name: str
    download_info: DownloadInfo


class DownloadRangeLink(TypedDict):
    name: str
    download_info: DownloadLink
    episode_idx: int
