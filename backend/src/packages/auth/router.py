from fastapi import APIRouter, Request, Response
from loguru import logger

from utils.exceptions import (
    InternalServerErrorException,
    NotFoundException,
    ConflictException,
)
from utils.responses import (
    APIResponse,
    ConflictResponse,
    InternalServerErrorResponse,
    SuccessResponse,
)

from .service import login_controller, refresh_controller, register_controller
from .responses import TokenOut, AccessTokenOut
from .schemas import LoginInfo, CreateInfo

auth_router = APIRouter()


@auth_router.post(
    "/login",
    responses={
        200: {"model": TokenOut},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def login(login_info: LoginInfo, request: Request, response: Response):
    request.state.func = "login"
    try:
        logger.info(f"Logging in {login_info.username}")
        status, data = await login_controller(
            login_info.username, login_info.password, request.state.request_id
        )

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="User logged in successfully",
            func="login",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error logging in {login_info.username}: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@auth_router.post(
    "/register",
    responses={
        200: {"model": SuccessResponse},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def register(
    request: Request,
    response: Response,
    register_info: CreateInfo,
):
    request.state.func = "register"
    try:
        logger.info(f"Registering {register_info.username}")
        status, data = await register_controller(
            register_info.username,
            register_info.password,
            request.state.request_id,
        )

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="User registered successfully",
            func="register",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error registering {register_info.username}: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@auth_router.post(
    "/refresh",
    responses={
        200: {"model": AccessTokenOut},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def refresh_token(
    refresh_token: str, response: Response, request: Request
):
    request.state.func = "refresh_token"
    try:
        logger.info("Refreshing token")
        status, data = refresh_controller(
            refresh_token, request.state.request_id
        )

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Token refreshed successfully",
            func="refresh_token",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise
