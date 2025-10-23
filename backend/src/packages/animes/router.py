import json
from fastapi.responses import FileResponse, StreamingResponse
import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Request, Response
from loguru import logger

from utils.responses import (
    APIResponse,
    ConflictResponse,
    InternalServerErrorResponse,
    NotFoundResponse,
    SuccessResponse,
)
from packages.auth import auth_scheme
from .service import (
    delete_download_episode_controller,
    download_anime_episode_bulk_controller,
    download_anime_episode_controller,
    get_download_episode_controller,
    get_download_episodes_controller,
    get_downloaded_animes_controller,
    get_in_emission_animes_controller,
    get_last_downloaded_episodes_controller,
    get_saved_animes_controller,
    save_anime_controller,
    search_anime_controller,
    get_anime_controller,
    unsave_anime_controller,
)
from .responses import (
    AnimeOut,
    DownloadTaskListOut,
    DownloadTaskOut,
    EpisodeDownloadListOut,
    SearchAnimeResultListOut,
    InEmissionAnimeListOut,
)
from utils.exceptions import (
    InternalServerErrorException,
    NotFoundException,
    ConflictException,
)
from .config import anime_settings

REDIS_URL = anime_settings.REDIS_URL

animes_router = APIRouter()


@animes_router.get(
    "/info/{anime_id}",
    responses={
        200: {"model": AnimeOut},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def get_anime(
    anime_id: str,
    request: Request,
    response: Response,
    force_update: bool = False,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "get_anime"
    try:
        logger.info(f"Getting anime with id: {anime_id}")
        status, data = await get_anime_controller(
            anime_id, current_user["id"], force_update
        )

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Anime retrieved",
            func="get_anime",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error getting saved animes: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@animes_router.get(
    "/search",
    responses={
        200: {"model": SuccessResponse},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def search_animes(
    query: str,
    request: Request,
    response: Response,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "search_animes"
    try:
        logger.info(f"Searching for {query}")
        status, data = await search_anime_controller(query, current_user["id"])

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Anime searched",
            func="search_animes",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error getting saved animes: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@animes_router.get(
    "/saved",
    responses={
        200: {"model": SearchAnimeResultListOut},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def get_saved_animes(
    request: Request,
    response: Response,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "get_saved_animes"
    try:
        logger.info("Getting saved animes")
        status, data = await get_saved_animes_controller(current_user["id"])

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Saved animes retrieved",
            func="get_saved_animes",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error getting saved animes: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@animes_router.put(
    "/save/{anime_id}",
    responses={
        200: {"model": SuccessResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def save_anime(
    anime_id: str,
    request: Request,
    response: Response,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "save_anime"
    try:
        logger.info(f"Saving anime with id: {anime_id}")
        status, _ = await save_anime_controller(anime_id, current_user["id"])

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Anime saved successfully",
            func="save_anime",
        )

        return response_data
    except Exception as e:
        logger.error(f"Error saving anime {anime_id}: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@animes_router.put(
    "/unsave/{anime_id}",
    responses={
        200: {"model": SuccessResponse},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def unsave_anime(
    anime_id: str,
    request: Request,
    response: Response,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "unsave_anime"
    try:
        logger.info(f"Unsaving anime with id: {anime_id}")
        status, _ = await unsave_anime_controller(
            anime_id, current_user["id"], request.state.request_id
        )

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Anime unsaved successfully",
            func="unsave_anime",
        )

        return response_data
    except Exception as e:
        logger.error(f"Error unsaving anime {anime_id}: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@animes_router.get(
    "/in-emission",
    responses={
        200: {"model": InEmissionAnimeListOut},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def get_in_emission_animes(
    request: Request,
    response: Response,
    current_user: dict = Depends(auth_scheme),
):
    try:
        logger.info("Getting in-emission animes")
        status, data = await get_in_emission_animes_controller(
            current_user["id"]
        )

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="In-emission animes retrieved",
            func="get_in_emission_animes",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error downloading anime: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@animes_router.get(
    "/download",
    responses={
        200: {"model": EpisodeDownloadListOut},
        500: {"model": InternalServerErrorResponse},
    },
)
async def get_download_episodes(
    request: Request,
    response: Response,
    anime_id: str | None = None,
    limit: int = 10,
    page: int = 1,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "get_download_episodes"
    try:
        logger.info("Getting downloads")
        status, data = await get_download_episodes_controller(
            current_user["id"], anime_id, limit, page
        )

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Downloads retrieved",
            func="get_download_episodes",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error getting downloads: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@animes_router.get("/download/last")
async def get_last_downloaded_episodes(
    request: Request,
    response: Response,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "get_last_downloaded_episodes"
    try:
        logger.info("Getting last downloaded episodes")
        status, data = await get_last_downloaded_episodes_controller(
            current_user["id"]
        )

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Last downloaded episodes retrieved",
            func="get_last_downloaded_episodes",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error getting last downloaded episodes: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@animes_router.get("/download/anime")
async def get_downloaded_animes(
    request: Request,
    response: Response,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "get_downloaded_animes"
    try:
        logger.info("Getting downloaded animes")
        status, data = await get_downloaded_animes_controller(
            current_user["id"]
        )

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Downloaded animes retrieved",
            func="get_downloaded_animes",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error getting downloaded animes: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@animes_router.get(
    "/stream/download",
)
async def get_download_status(job_ids: str):
    ids = set(job_ids.split(","))
    logger.info(f"Getting download status for jobs: {ids}")

    async def event_generator():
        redis_sub = aioredis.from_url(f"{REDIS_URL}/2")
        pubsub = redis_sub.pubsub()
        await pubsub.subscribe("job_updates")

        async for message in pubsub.listen():
            if message["type"] == "message":
                payload = json.loads(message["data"])
                if payload["job_id"] in ids:
                    data = json.dumps(payload)
                    yield f"data: {data}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@animes_router.get(
    "/download/episode/{episode_id}",
    responses={
        404: {"model": NotFoundResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def get_download_episode(
    episode_id: int,
    request: Request,
    response: Response,
):
    request.state.func = "get_download_episode"
    try:
        logger.info(f"Getting download episode with id: {episode_id}")
        status, data = await get_download_episode_controller(episode_id)

        response.status_code = status

        response_data = FileResponse(
            data["path"],
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": "attachment; "
                + f"filename={data['filename']}"
            },
        )

        return response_data
    except Exception as e:
        logger.error(
            f"Error getting download episode with id: {episode_id}: {e}"
        )
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request.state.request_id,
            message=str(e),
            func="get_download_episode",
        )


@animes_router.post(
    "/download/single/{anime_id}/{episode_number}",
    responses={
        201: {"model": DownloadTaskOut},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def download_anime_episode(
    anime_id: str,
    episode_number: int,
    request: Request,
    response: Response,
    force_download: bool = False,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "download_anime_episode"

    try:
        logger.info(f"Downloading anime with id: {anime_id}")

        status, data = await download_anime_episode_controller(
            anime_id,
            episode_number,
            force_download,
            current_user["id"],
            request.state.request_id,
        )

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Anime downloaded successfully",
            func="download_anime_episode",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(
            f"Error downloading anime {anime_id} - {episode_number}: {e}"
        )
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@animes_router.delete(
    "/download/single/{anime_id}/{episode_number}",
    responses={
        200: {"model": SuccessResponse},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def delete_download_episode(
    anime_id: str,
    episode_number: int,
    request: Request,
    response: Response,
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "delete_download_episode"
    try:
        logger.info(f"Deleting download episode with id: {episode_number}")
        status, _ = await delete_download_episode_controller(
            anime_id,
            episode_number,
            current_user["id"],
            request.state.request_id,
        )

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Download episode deleted successfully",
            func="delete_download_episode",
        )

        return response_data
    except Exception as e:
        logger.error(
            f"Error deleting download episode with id: {episode_number}: {e}"
        )
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise


@animes_router.post(
    "/download/bulk/{anime_id}",
    responses={
        201: {"model": DownloadTaskListOut},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def download_anime_episode_bulk(
    anime_id: str,
    request: Request,
    response: Response,
    episodes: list[int],
    current_user: dict = Depends(auth_scheme),
):
    request.state.func = "download_anime_episode_bulk"

    try:
        logger.info(f"Downloading anime with id: {anime_id}")

        status, data = await download_anime_episode_bulk_controller(
            anime_id,
            episodes,
            current_user["id"],
            request.state.request_id,
        )

        response.status_code = status

        response_data = APIResponse(
            success=True,
            message="Anime downloaded successfully",
            func="download_anime_episode_bulk",
            payload=data,
        )

        return response_data
    except Exception as e:
        logger.error(f"Error downloading anime {anime_id}: {e}")
        if not isinstance(e, (NotFoundException, ConflictException)):
            raise InternalServerErrorException(
                "Internal server error", request_id=request.state.request_id
            )
        raise
