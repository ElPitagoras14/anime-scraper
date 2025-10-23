from fastapi import APIRouter, Depends, Request, Response
from loguru import logger

from packages.auth import auth_scheme
from utils.exceptions import (
    InternalServerErrorException,
    NotFoundException,
    ConflictException,
)
from utils.responses import APIResponse
from .service import (
    check_username_controller,
    get_avatars_controller,
    get_me_controller,
    get_user_statistics_controller,
    get_users_controller,
    update_user_controller,
)
from .schemas import UserInfo

users_router = APIRouter()


@users_router.get("")
async def get_users(
    request: Request,
    response: Response,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "get_users"
    try:
        logger.info("Getting users")
        status, data = await get_users_controller(current_user["id"])

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Users retrieved",
            func="get_users",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@users_router.get("/me")
async def get_me(
    request: Request,
    response: Response,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "get_me"
    try:
        logger.info("Getting me")
        status, data = await get_me_controller(
            current_user["id"], request.state.request_id
        )
        response.status_code = status
        response_data = APIResponse(
            success=True,
            message="User retrieved",
            func="get_me",
            payload=data,
        )
        return response_data
    except Exception as e:
        logger.error(f"Error getting me: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@users_router.get("/username/{username}")
async def check_username(
    username: str,
    request: Request,
    response: Response,
):
    request.state.func = "check_username"
    try:
        logger.info(f"Checking username {username}")
        status, data = await check_username_controller(username)
        response.status_code = status
        response_data = APIResponse(
            success=True,
            message="Username checked",
            func="check_username",
            payload=data,
        )
        return response_data
    except Exception as e:
        logger.error(f"Error checking username {username}: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@users_router.put("")
async def update_user(
    user_info: UserInfo,
    request: Request,
    response: Response,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "update_user"
    try:
        logger.info("Updating user")
        status, _ = await update_user_controller(
            user_info, current_user["id"], request.state.request_id
        )

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="User updated",
            func="update_user",
        )

        return response_data
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@users_router.get("/avatars")
async def get_avatars(
    request: Request,
    response: Response,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "get_avatars"
    try:
        logger.info("Getting avatars")
        status, data = await get_avatars_controller()

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Avatars retrieved",
            func="get_avatars",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error getting avatars: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@users_router.get("/statistics")
async def get_user_statistics(
    request: Request,
    response: Response,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "get_users_statistics"
    try:
        logger.info("Getting users statistics")
        status, data = await get_user_statistics_controller(current_user["id"])

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="User statistics retrieved",
            func="get_users_statistics",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error getting user statistics: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise
