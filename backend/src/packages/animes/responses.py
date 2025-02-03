from datetime import datetime
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from utils.responses import SuccessResponse


class DownloadJob(BaseModel):
    anime: str
    episode: str
    job_id: str

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class DownloadJobOut(SuccessResponse):
    payload: DownloadJob | None


class DownloadJobList(BaseModel):
    items: list[DownloadJob]
    total: int


class DownloadJobListOut(SuccessResponse):
    payload: DownloadJobList | None


class Episode(BaseModel):
    id: int
    name: str
    link: str
    episode_id: int

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class AnimeStreamingLinks(BaseModel):
    name: str
    items: list[Episode] | None
    total: int


class AnimeStreamingLinksOut(SuccessResponse):
    payload: AnimeStreamingLinks | None


class Anime(BaseModel):
    anime_id: str
    name: str
    description: str
    image: str
    is_finished: bool
    week_day: str | None
    is_saved: bool = False

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class AnimeOut(SuccessResponse):
    payload: Anime | None


class AnimeList(BaseModel):
    items: list[Anime]
    total: int


class AnimeListOut(SuccessResponse):
    payload: AnimeList | None


class AnimeCard(BaseModel):
    name: str
    image: str
    anime_id: str
    is_saved: bool = False

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class AnimeCardList(BaseModel):
    items: list[AnimeCard]
    total: int


class AnimeCardListOut(SuccessResponse):
    payload: AnimeCardList | None


class AnimeCache(BaseModel):
    anime_id: str
    name: str
    size: float

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class AnimeCacheList(BaseModel):
    items: list[AnimeCache]
    size: str
    measured_in: str
    total: int

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class AnimeCacheListOut(SuccessResponse):
    payload: AnimeCacheList | None


class DownloadJobInfo(BaseModel):
    job_id: str
    status: str
    progress: float
    total: str

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class DownloadJobInfoOut(SuccessResponse):
    payload: DownloadJobInfo | None


class EpisodeDownloadInfo(BaseModel):
    episode_id: int
    image: str
    anime: str
    episode_name: str
    created_at: datetime
    status: str
    progress: float
    total: str
    filename: str

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class EpisodeDownloadInfoOut(SuccessResponse):
    payload: EpisodeDownloadInfo | None


class EpisodeDownloadList(BaseModel):
    items: list[EpisodeDownloadInfo]
    total: int


class EpisodeDownloadListOut(SuccessResponse):
    payload: EpisodeDownloadList | None


class Statistics(BaseModel):
    animes_saved: int
    episodes_to_download: int
    animes_in_emission: int

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class StatisticsOut(SuccessResponse):
    payload: Statistics | None
