import time
from typing import Union

from fastapi import APIRouter, Depends, Request, Response
from loguru import logger

from utils.responses import (
    InternalServerErrorResponse,
    SuccessResponse,
    ConflictResponse,
    NotFoundResponse,
)

from ..auth import get_current_user

from .service import (
    change_user_avatar_controller,
    change_user_status_controller,
    create_user_controller,
    delete_user_controller,
    get_user_controller,
    get_all_users_controller,
    update_user_info_controller,
)
from .responses import UserListOut, UserOut, UserTokenOut
from .schemas import NewUser, UpdateUser

users_router = APIRouter()


@users_router.get(
    "",
    response_model=Union[UserListOut, InternalServerErrorResponse],
)
async def get_all_users(
    request: Request,
    response: Response,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info("Getting users")
        if not current_user["is_admin"]:
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                func="change_user_status",
                message="Unauthorized",
            )
        users = get_all_users_controller()
        process_time = time.time() - start_time
        logger.info(f"Got users in {process_time:.2f} seconds")
        return UserListOut(
            request_id=request_id,
            process_time=process_time,
            func="get_all_users",
            message="Users retrieved",
            payload=users,
        )
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="get_all_users"
        )


@users_router.get(
    "/info/{user_id}",
    response_model=Union[
        UserOut, InternalServerErrorResponse, NotFoundResponse
    ],
)
async def get_user(request: Request, response: Response, user_id: str):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Getting user {user_id}")
        user = get_user_controller(user_id)
        process_time = time.time() - start_time
        if not user:
            response.status_code = 404
            return NotFoundResponse(
                request_id=request_id,
                process_time=process_time,
                func="get_user",
                message="User not found",
            )
        logger.info(f"Got user {user_id} in {process_time:.2f} seconds")
        return UserOut(
            request_id=request_id,
            process_time=process_time,
            func="get_user",
            message="User retrieved",
            payload=user,
        )
    except Exception as e:
        logger.error(f"Error getting user {user_id}: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="get_user"
        )


@users_router.get(
    "/me",
    response_model=Union[UserOut, InternalServerErrorResponse],
)
async def get_current_user_info(
    request: Request,
    response: Response,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info("Getting current user")
        user = get_user_controller(current_user["sub"])
        process_time = time.time() - start_time
        logger.info(f"Got current user in {process_time:.2f} seconds")
        return UserOut(
            request_id=request_id,
            process_time=process_time,
            func="get_current_user_info",
            message="User retrieved",
            payload=user,
        )
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="get_current_user_info"
        )


@users_router.post(
    "",
    response_model=Union[
        UserOut, InternalServerErrorResponse, ConflictResponse
    ],
)
async def create_user(new_user: NewUser, request: Request, response: Response):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info("Creating user")
        user = create_user_controller(new_user)
        process_time = time.time() - start_time
        if not user:
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                process_time=process_time,
                func="create_user",
                message="User already exists",
            )
        logger.info(f"Created user in {process_time:.2f} seconds")
        return UserOut(
            request_id=request_id,
            process_time=process_time,
            func="create_user",
            message="User created",
            payload=user,
        )
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="create_user"
        )


@users_router.put(
    "/info/{user_id}",
    response_model=Union[
        UserTokenOut,
        InternalServerErrorResponse,
        ConflictResponse,
    ],
)
async def update_user_info(
    request: Request,
    response: Response,
    user_id: str,
    current_user: dict = Depends(get_current_user),
    new_user: UpdateUser = None,
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Updating user {user_id} info")

        if current_user["sub"] != user_id:
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                func="update_user_info",
                message="Cannot update own info",
            )

        success, value = update_user_info_controller(user_id, new_user)
        process_time = time.time() - start_time
        if not success:
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                process_time=process_time,
                func="update_user_info",
                message=value,
            )
        logger.info(
            f"Updated user {user_id} info in {process_time:.2f} seconds"
        )
        return UserTokenOut(
            request_id=request_id,
            process_time=process_time,
            func="update_user_info",
            message="User info updated",
            payload=value,
        )
    except Exception as e:
        logger.error(f"Error updating user {user_id} info: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="update_user_info"
        )


@users_router.put(
    "/avatar",
    response_model=Union[
        UserOut, InternalServerErrorResponse, NotFoundResponse
    ],
)
async def change_user_avatar(
    request: Request,
    response: Response,
    avatar: str,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        user_id = current_user["sub"]
        logger.info(f"Changing user {user_id} avatar")

        success, value = change_user_avatar_controller(user_id, avatar)
        process_time = time.time() - start_time
        if not success:
            response.status_code = 404
            return NotFoundResponse(
                request_id=request_id,
                process_time=process_time,
                func="change_user_avatar",
                message="User not found",
            )
        logger.info(
            f"Changed user {user_id} avatar in {process_time:.2f} seconds"
        )
        return UserOut(
            request_id=request_id,
            process_time=process_time,
            func="change_user_avatar",
            message="User avatar changed",
            payload=value,
        )
    except Exception as e:
        logger.error(f"Error changing user {user_id} avatar: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="change_user_avatar"
        )


@users_router.put(
    "/status/{user_id}",
    response_model=Union[
        UserOut,
        InternalServerErrorResponse,
        NotFoundResponse,
        ConflictResponse,
    ],
)
async def change_user_status(
    request: Request,
    response: Response,
    user_id: str,
    is_active: bool = None,
    is_admin: bool = None,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Changing user {user_id} status")

        if not current_user["is_admin"]:
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                func="change_user_status",
                message="Unauthorized",
            )

        if current_user["sub"] == user_id:
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                func="change_user_status",
                message="Cannot change own status",
            )

        user = change_user_status_controller(
            user_id, is_active=is_active, is_admin=is_admin
        )
        process_time = time.time() - start_time
        if not user:
            response.status_code = 404
            return NotFoundResponse(
                request_id=request_id,
                process_time=process_time,
                func="change_user_status",
                message="User not found",
            )
        logger.info(
            f"Changed user {user_id} status in {process_time:.2f} seconds"
        )
        return UserOut(
            request_id=request_id,
            process_time=process_time,
            func="change_user_status",
            message="User status changed",
            payload=user,
        )
    except Exception as e:
        logger.error(f"Error changing user {user_id} status: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="change_user_status"
        )


@users_router.delete(
    "/{user_id}",
    response_model=Union[
        UserOut, InternalServerErrorResponse, NotFoundResponse
    ],
)
async def delete_user(
    request: Request,
    response: Response,
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Deleting user {user_id}")

        if not current_user["is_admin"]:
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                func="delete_user",
                message="Unauthorized",
            )

        status = delete_user_controller(user_id)
        process_time = time.time() - start_time
        if not status:
            response.status_code = 404
            return NotFoundResponse(
                request_id=request_id,
                process_time=process_time,
                func="delete_user",
                message="User not found",
            )
        logger.info(f"Deleted user {user_id} in {process_time:.2f} seconds")
        return SuccessResponse(
            request_id=request_id,
            process_time=process_time,
            func="delete_user",
            message="User deleted",
        )
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="delete_user"
        )
