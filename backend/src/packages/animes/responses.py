from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from utils.responses import SuccessResponse


class Link(BaseModel):
    service: str
    link: str


class AnimeDownloadLink(BaseModel):
    name: str
    download_info: Link | None
    episode_id: int

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class AnimeDownloadLinkList(BaseModel):
    name: str
    items: list[AnimeDownloadLink | None] | None
    total: int


class Episode(BaseModel):
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


class AnimeDownloadLinkOut(SuccessResponse):
    payload: AnimeDownloadLink | None


class AnimeDownloadLinkListOut(SuccessResponse):
    payload: AnimeDownloadLinkList | None


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
    size: float
    measured_in: str
    total: int

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class AnimeCacheListOut(SuccessResponse):
    payload: AnimeCacheList | None
