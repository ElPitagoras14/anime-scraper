from fastapi import APIRouter

from packages.animes import animes_router
from packages.users import users_router
from packages.auth import auth_router


router = APIRouter()

router.include_router(
    animes_router,
    prefix="/animes",
    tags=["Anime"],
)
router.include_router(
    users_router,
    prefix="/users",
    tags=["Users"],
)
router.include_router(auth_router, prefix="/auth", tags=["Auth"])
