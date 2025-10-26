from .responses import (
    AnimeFranchise,
    AnimeFranchiseList,
    BaseAnime,
    Franchise,
    FranchiseList,
)


def cast_base_anime(anime: dict) -> BaseAnime:
    return BaseAnime(
        id=anime["id"],
        title=anime["title"],
        type=anime["type"],
        poster=anime["poster"],
        is_saved=anime["is_saved"],
        save_date=anime["save_date"],
    )


def cast_franchise(franchise: dict) -> Franchise:
    return Franchise(
        id=franchise["id"],
        name=franchise["name"],
        animes=[cast_base_anime(anime) for anime in franchise["animes"]],
    )


def cast_franchise_list(
    franchises: list[dict],
    total: int,
) -> FranchiseList:
    return FranchiseList(
        items=[cast_franchise(franchise) for franchise in franchises],
        total=total,
    )


def cast_anime_franchise(anime_franchise: dict) -> AnimeFranchise:
    return AnimeFranchise(
        id=anime_franchise["id"],
        title=anime_franchise["title"],
        type=anime_franchise["type"],
        poster=anime_franchise["poster"],
        is_saved=anime_franchise["is_saved"],
        save_date=anime_franchise["save_date"],
        franchise=anime_franchise["franchise"],
    )


def cast_anime_franchise_list(
    anime_franchises: list[dict],
) -> AnimeFranchiseList:
    return AnimeFranchiseList(
        items=[
            cast_anime_franchise(anime_franchise)
            for anime_franchise in anime_franchises
        ],
        total=len(anime_franchises),
    )
