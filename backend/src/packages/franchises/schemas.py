from pydantic import BaseModel


class AnimeInfo(BaseModel):
    id: str
    season: int


class CreateFranchise(BaseModel):
    franchise: str
    animes: list[AnimeInfo]
