from datetime import datetime
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from utils.responses import SuccessResponse


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


class Franchise(BaseModel):
    id: str
    name: str
    animes: list[BaseAnime] | None


class FranchiseList(BaseModel):
    items: list[Franchise]
    total: int


class FranchiseListOut(SuccessResponse):
    payload: FranchiseList | None


class AnimeFranchise(BaseAnime):
    franchise: str | None


class AnimeFranchiseList(BaseModel):
    items: list[AnimeFranchise]
    total: int


class AnimeFranchiseListOut(SuccessResponse):
    payload: AnimeFranchiseList | None
