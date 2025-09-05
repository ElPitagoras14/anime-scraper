from datetime import datetime
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from utils.responses import SuccessResponse


class RelatedInfo(BaseModel):
    id: str
    title: str
    type: str


class EpisodeInfo(BaseModel):
    id: int
    anime_id: str
    image_preview: str | None = None
    is_user_downloaded: bool
    is_global_downloaded: bool

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class BaseAnime(BaseModel):
    id: str
    title: str
    type: str
    poster: str
    is_saved: bool
    save_date: datetime | None = None

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        json_enconders={
            datetime: lambda v: v.isoformat().replace("+00:00", "Z")
        },
    )


class SearchAnimeResult(BaseAnime):
    pass


class SearchAnimeResultList(BaseModel):
    items: list[SearchAnimeResult]
    total: int


class SearchAnimeResultListOut(SuccessResponse):
    payload: SearchAnimeResultList | None


class Anime(BaseAnime):
    season: int | None = None
    platform: str
    description: str
    genres: list[str]
    other_titles: list[str]
    related_info: list[RelatedInfo]
    week_day: str | None = None
    episodes: list[EpisodeInfo]
    is_finished: bool
    last_scraped_at: datetime | None = None
    last_forced_update: datetime | None = None

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        json_enconders={
            datetime: lambda v: v.isoformat().replace("+00:00", "Z")
        },
    )


class AnimeOut(SuccessResponse):
    payload: Anime | None


class InEmissionAnime(BaseAnime):
    week_day: str

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class InEmissionAnimeList(BaseModel):
    items: list[InEmissionAnime]
    total: int


class InEmissionAnimeListOut(SuccessResponse):
    payload: InEmissionAnimeList | None


class EpisodeDownload(BaseModel):
    id: int
    anime_id: str
    title: str
    episode_number: int
    poster: str
    job_id: str | None = None
    size: int | None = None
    status: str
    downloaded_at: datetime | None = None

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        json_enconders={
            datetime: lambda v: v.isoformat().replace("+00:00", "Z")
        },
    )


class EpisodeDownloadList(BaseModel):
    items: list[EpisodeDownload]
    total: int


class EpisodeDownloadListOut(SuccessResponse):
    payload: EpisodeDownloadList | None


class AnimeDownloadInfo(BaseModel):
    id: str
    title: str


class AnimeDownloadInfoList(BaseModel):
    items: list[AnimeDownloadInfo]
    total: int


class AnimeDownloadInfoListOut(SuccessResponse):
    payload: AnimeDownloadInfoList | None


class DownloadTask(BaseModel):
    job_id: str | None = None


class DownloadTaskOut(SuccessResponse):
    payload: DownloadTask | None


class DownloadTaskStatus(DownloadTask):
    episode_number: int
    success: bool


class DownloadTaskList(BaseModel):
    items: list[DownloadTaskStatus]
    total: int


class DownloadTaskListOut(SuccessResponse):
    payload: DownloadTaskList | None
