from fastapi import APIRouter, Depends

from packages.animes import animes_router
from packages.users import users_router
from packages.auth import auth_router, get_current_user


router = APIRouter()

router.include_router(
    animes_router,
    prefix="/animes",
    tags=["Anime"],
    dependencies=[Depends(get_current_user)],
)
router.include_router(
    users_router,
    prefix="/users",
    tags=["Users"],
    dependencies=[Depends(get_current_user)],
)
router.include_router(auth_router, prefix="/auth", tags=["Auth"])
