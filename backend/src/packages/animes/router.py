import os
import time
from typing import Union
from fastapi import APIRouter, Depends, Request, Response
from loguru import logger

from utils.responses import (
    InternalServerErrorResponse,
    ConflictResponse,
    SuccessResponse,
)

from ..auth import get_current_user

from .service import (
    delete_anime_cache_controller,
    delete_saved_anime_controller,
    get_all_animes_cache_controller,
    get_anime_info_controller,
    get_saved_animes_controller,
    get_streaming_links_controller,
    get_single_episode_download_link_controller,
    get_range_episodes_download_links_controller,
    save_anime_controller,
    search_anime_query_controller,
)
from .responses import (
    AnimeCardListOut,
    AnimeDownloadLinkListOut,
    AnimeDownloadLinkOut,
    AnimeStreamingLinksOut,
    AnimeOut,
    AnimeListOut,
    AnimeCacheListOut,
)

animes_router = APIRouter()

curr_workspace = os.getcwd()
proj_dir = os.path.dirname(curr_workspace)


@animes_router.get(
    "/info/{anime}",
    response_model=Union[AnimeOut, InternalServerErrorResponse],
)
async def get_anime_info(
    anime: str,
    response: Response,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Getting anime information for {anime}")
        anime_info = await get_anime_info_controller(anime, current_user)
        process_time = time.time() - start_time
        logger.info(
            f"Got anime information for {anime} in {process_time:.2f} seconds"
        )
        return AnimeOut(
            request_id=request_id,
            process_time=process_time,
            func="get_anime_info",
            message="Anime information retrieved",
            payload=anime_info,
        )
    except Exception as e:
        logger.error(f"Error getting anime information for {anime}: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="get_anime_info"
        )


@animes_router.get(
    "/search",
    response_model=Union[AnimeCardListOut, InternalServerErrorResponse],
)
async def search_anime_query(
    query: str,
    response: Response,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Searching for anime with query: {query}")
        anime_card_list = await search_anime_query_controller(
            query, current_user
        )
        process_time = time.time() - start_time
        logger.info(
            f"Got anime search results for {query} in "
            + f"{process_time:.2f} seconds"
        )
        return AnimeCardListOut(
            request_id=request_id,
            process_time=process_time,
            func="search_anime_query",
            message="Anime search results retrieved",
            payload=anime_card_list,
        )
    except Exception as e:
        logger.error(f"Error searching for anime with query: {query}: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="search_anime_query"
        )


@animes_router.get(
    "/streamlinks/{anime}",
    response_model=Union[
        AnimeStreamingLinksOut, InternalServerErrorResponse, ConflictResponse
    ],
)
async def get_anime_streaming_links(
    anime: str, response: Response, request: Request
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Getting anime stream links for {anime}")
        success, value = await get_streaming_links_controller(anime)
        process_time = time.time() - start_time
        if not success:
            logger.error(
                f"Error getting anime stream links for {anime}: {value}"
            )
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                message=value,
                func="get_anime_streaming_links",
            )
        logger.info(
            f"Got anime stream links for {anime} in {process_time:.2f} seconds"
        )
        return AnimeStreamingLinksOut(
            request_id=request_id,
            process_time=process_time,
            func="get_anime_streaming_links",
            message="Anime links retrieved",
            payload=value,
        )
    except Exception as e:
        logger.error(f"Error getting anime stream links for {anime}: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id,
            message=str(e),
            func="get_anime_streaming_links",
        )


@animes_router.post(
    "/downloadlinks/range",
    response_model=Union[
        AnimeDownloadLinkListOut, InternalServerErrorResponse
    ],
)
async def get_range_episodes_download_links(
    episode_links: list[dict],
    response: Response,
    request: Request,
    episode_range: str = None,
):
    start_time = time.time()
    request_id = request.state.request_id
    anime_name = None
    try:
        anime_name = "-".join(
            episode_links[0]["link"].split("/")[-1].split("-")[:-1]
        )
        logger.info(
            f"Getting anime download links for {anime_name} "
            + f"with range {episode_range}"
        )
        anime_links = await get_range_episodes_download_links_controller(
            episode_links, episode_range
        )
        process_time = time.time() - start_time
        logger.info(
            f"Got anime download links for {anime_name} "
            + f"with range {episode_range} in {process_time:.2f} seconds"
        )
        return AnimeDownloadLinkListOut(
            request_id=request_id,
            process_time=process_time,
            func="get_range_episodes_download_links",
            message="Anime download links retrieved",
            payload=anime_links,
        )
    except Exception as e:
        logger.error(
            f"Error getting anime download links for {anime_name} "
            + f"with range {episode_range}: {e}"
        )
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id,
            message=str(e),
            func="get_range_episodes_download_links",
        )


@animes_router.post(
    "/downloadlinks/single",
    response_model=Union[AnimeDownloadLinkOut, InternalServerErrorResponse],
)
async def get_single_episode_download_link(
    episode_link: str, episode_id: int, response: Response, request: Request
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Getting single download link for {episode_link}")
        download_link = await get_single_episode_download_link_controller(
            episode_link, episode_id
        )
        process_time = time.time() - start_time
        logger.info(
            f"Got single download link for {episode_link} "
            + f"in {process_time:.2f} seconds"
        )
        return AnimeDownloadLinkOut(
            request_id=request_id,
            process_time=process_time,
            func="get_single_episode_download_link",
            message="Single download link retrieved",
            payload=download_link,
        )
    except Exception as e:
        logger.error(
            f"Error getting single download link for {episode_link}: {e}"
        )
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id,
            message=str(e),
            func="get_single_episode_download_link",
        )


@animes_router.get(
    "/saved",
    response_model=Union[AnimeListOut, InternalServerErrorResponse],
)
async def get_saved_animes(
    response: Response,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info("Getting saved animes")
        anime_card_list = await get_saved_animes_controller(current_user)
        process_time = time.time() - start_time
        logger.info(f"Got saved animes in {process_time:.2f} seconds")
        return AnimeListOut(
            request_id=request_id,
            process_time=process_time,
            func="get_saved_animes",
            message="Saved animes retrieved",
            payload=anime_card_list,
        )
    except Exception as e:
        logger.error(f"Error getting saved animes: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="get_saved_animes"
        )


@animes_router.post(
    "/saved/{anime_id}",
    response_model=Union[
        AnimeOut, InternalServerErrorResponse, ConflictResponse
    ],
)
async def save_anime(
    anime_id: str,
    response: Response,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Adding anime with id: {anime_id} to saved")
        status, value = await save_anime_controller(anime_id, current_user)
        process_time = time.time() - start_time
        if not status:
            logger.error(
                "Error adding anime with "
                + f"id: {anime_id} to saved: {value}"
            )
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                message=value,
                func="save_anime",
            )
        logger.info(
            f"Anime with id: {anime_id} added to "
            + f"saved in {process_time:.2f} seconds"
        )
        return AnimeOut(
            request_id=request_id,
            process_time=process_time,
            func="save_anime",
            message="Anime added to saved",
            payload=value,
        )
    except Exception as e:
        logger.error(f"Error adding anime with id: {anime_id} to saved: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id,
            message=str(e),
            func="save_anime",
        )


@animes_router.delete(
    "/saved/{anime_id}",
    response_model=Union[
        AnimeOut, InternalServerErrorResponse, ConflictResponse
    ],
)
async def delete_saved_anime(
    anime_id: str,
    response: Response,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Deleting saved anime with id: {anime_id}")
        status, value = await delete_saved_anime_controller(
            anime_id, current_user
        )
        process_time = time.time() - start_time
        if not status:
            logger.error(
                "Error deleting saved anime with " + f"id: {anime_id}: {value}"
            )
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                message=value,
                func="delete_saved_anime",
            )
        logger.info(
            f"Deleted saved anime with id: {anime_id} "
            + f"in {process_time:.2f} seconds"
        )
        return AnimeOut(
            request_id=request_id,
            process_time=process_time,
            func="delete_saved_anime",
            message="Anime deleted from saved",
            payload=value,
        )
    except Exception as e:
        logger.error(f"Error deleting saved anime with id: {anime_id}: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id,
            message=str(e),
            func="delete_saved_anime",
        )


@animes_router.get(
    "/cache",
    response_model=Union[
        AnimeCacheListOut, InternalServerErrorResponse, ConflictResponse
    ],
)
async def get_all_animes_cache(
    response: Response,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info("Getting all animes cache")
        if not current_user["is_admin"]:
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                func="change_user_status",
                message="Unauthorized",
            )
        cache = await get_all_animes_cache_controller()
        process_time = time.time() - start_time
        logger.info(f"Got all animes cache in {process_time:.2f} seconds")
        return AnimeCacheListOut(
            request_id=request_id,
            process_time=process_time,
            func="get_all_animes_cache",
            message="All animes cache retrieved",
            payload=cache,
        )
    except Exception as e:
        logger.error(f"Error getting all animes cache: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="get_all_animes_cache"
        )


@animes_router.delete(
    "/cache/{anime_id}",
    response_model=Union[
        SuccessResponse, InternalServerErrorResponse, ConflictResponse
    ],
)
async def delete_anime_cache(
    anime_id: str,
    response: Response,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Deleting anime cache with id: {anime_id}")
        if not current_user["is_admin"]:
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                func="change_user_status",
                message="Unauthorized",
            )
        success, value = await delete_anime_cache_controller(anime_id)
        if not success:
            logger.error(
                f"Error deleting anime cache with id: {anime_id}: {value}"
            )
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                message=value,
                func="delete_anime_cache",
            )
        process_time = time.time() - start_time
        logger.info(
            f"Deleted anime cache with id: {anime_id} "
            + f"in {process_time:.2f} seconds"
        )
        return SuccessResponse(
            request_id=request_id,
            process_time=process_time,
            func="delete_anime_cache",
            message="Anime cache deleted",
        )
    except Exception as e:
        logger.error(f"Error deleting anime cache with id: {anime_id}: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="delete_anime_cache"
        )
