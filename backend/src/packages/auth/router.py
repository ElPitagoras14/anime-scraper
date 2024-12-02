import time
from typing import Union
from fastapi import APIRouter, Request, Response
from loguru import logger

from utils.responses import (
    ConflictResponse,
    InternalServerErrorResponse,
    SuccessResponse,
)

from .service import login_controller, register_controller
from .responses import TokenOut
from .schemas import AuthInfo
from .config import auth_settings

auth_router = APIRouter()

EXPIRE_MINUTES = auth_settings.EXPIRE_MINUTES


@auth_router.post(
    "/login",
    response_model=Union[
        TokenOut, InternalServerErrorResponse, ConflictResponse
    ],
)
async def login(request: Request, response: Response, login_input: AuthInfo):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info("Logging in")
        success, value = login_controller(
            login_input.username, login_input.password
        )
        process_time = time.time() - start_time

        if not success:
            logger.warning(f"Error logging in: {value}")
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                process_time=process_time,
                message=value,
                func="login",
            )

        logger.info(f"Logged in in {process_time:.2f} seconds")
        return TokenOut(
            request_id=request_id,
            process_time=process_time,
            func="login",
            message="User logged in",
            payload=value,
        )
    except Exception as e:
        logger.error(f"Error logging in: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="login"
        )


@auth_router.post("/register")
async def register(
    register_info: AuthInfo, request: Request, response: Response
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info("Registering")
        success, value = register_controller(
            register_info.username,
            register_info.password,
            register_info.avatar,
        )
        process_time = time.time() - start_time

        if not success:
            logger.warning(f"Error registering: {value}")
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                process_time=process_time,
                message=value,
                func="register",
            )

        logger.info(f"Registered in {process_time:.2f} seconds")
        return SuccessResponse(
            request_id=request_id,
            process_time=process_time,
            func="register",
            message="User registered",
        )
    except Exception as e:
        logger.error(f"Error registering: {e}")
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="register"
        )
