from fastapi import APIRouter, Depends, Request, Response
from loguru import logger

from utils.responses import (
    APIResponse,
    ConflictResponse,
    InternalServerErrorResponse,
    SuccessResponse,
)
from utils.exceptions import (
    InternalServerErrorException,
    NotFoundException,
    ConflictException,
)
from packages.auth import auth_scheme
from .service import (
    create_franchise_controller,
    get_animes_for_franchises_controller,
    get_franchises_controller,
)
from .responses import (
    AnimeFranchiseListOut,
    FranchiseListOut,
)
from .schemas import CreateFranchise


franchises_router = APIRouter()


@franchises_router.get(
    "",
    responses={
        200: {"model": FranchiseListOut},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def get_franchises(
    request: Request,
    response: Response,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "get_franchises"
    try:
        logger.info("Getting franchises")
        status, data = await get_franchises_controller(current_user["id"])

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Franchises retrieved",
            func="get_franchises",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error getting franchises: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@franchises_router.post(
    "",
    responses={
        200: {"model": SuccessResponse},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def create_franchise(
    request: Request,
    response: Response,
    franchise_info: CreateFranchise,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "create_franchise"
    try:
        logger.info("Creating franchise")
        status, data = await create_franchise_controller(
            franchise_info, request.state.request_id
        )

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Franchise created successfully",
            func="create_franchise",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error creating franchise: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@franchises_router.get(
    "/animes",
    responses={
        200: {"model": AnimeFranchiseListOut},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def get_animes_for_franchises(
    request: Request,
    response: Response,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "get_animes_for_franchises"
    try:
        logger.info("Getting animes")
        status, data = await get_animes_for_franchises_controller(
            current_user["id"]
        )

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Animes retrieved",
            func="get_animes_for_franchises",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error getting animes: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise
