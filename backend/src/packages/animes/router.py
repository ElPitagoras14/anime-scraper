import os
import time
from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import FileResponse
from loguru import logger

from utils.responses import (
    InternalServerErrorResponse,
    ConflictResponse,
    NotFoundResponse,
    SuccessResponse,
)

from packages.auth import get_current_user, verify_token

from .service import (
    delete_anime_cache_controller,
    delete_saved_anime_controller,
    delete_user_download_episodes_controller,
    download_episode_controller,
    enqueue_range_episodes_download_links_controller,
    enqueue_single_episode_download_links_controller,
    force_re_download_controller,
    get_all_animes_cache_controller,
    get_anime_info_controller,
    get_job_info_controller,
    get_saved_animes_controller,
    get_streaming_links_controller,
    get_user_download_episodes_controller,
    get_user_statistics_controller,
    save_anime_controller,
    search_anime_query_controller,
)
from .responses import (
    AnimeCardListOut,
    AnimeStreamingLinksOut,
    AnimeOut,
    AnimeListOut,
    AnimeCacheListOut,
    DownloadJobListOut,
    DownloadJobOut,
    DownloadJobInfoOut,
    EpisodeDownloadListOut,
    StatisticsOut,
)

animes_router = APIRouter()

curr_workspace = os.getcwd()
proj_dir = os.path.dirname(curr_workspace)


@animes_router.get(
    "/info/{anime}",
    responses={
        200: {"model": AnimeOut},
        500: {"model": InternalServerErrorResponse},
    },
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
        anime_info = await get_anime_info_controller(
            anime, current_user["sub"]
        )
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
    responses={
        200: {"model": AnimeCardListOut},
        500: {"model": InternalServerErrorResponse},
    },
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
            query, current_user["sub"]
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
    responses={
        200: {"model": AnimeStreamingLinksOut},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def get_anime_streaming_links(
    anime: str,
    response: Response,
    request: Request,
    current_user: dict = Depends(get_current_user),
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
    responses={
        200: {"model": DownloadJobListOut},
        500: {"model": InternalServerErrorResponse},
    },
)
async def enqueue_range_episodes_download_links(
    episode_links: list[dict],
    response: Response,
    request: Request,
    episode_range: str = None,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    anime_name = None
    try:
        anime_name = "-".join(
            episode_links[0]["link"].split("/")[-1].split("-")[:-1]
        )
        logger.info(
            f"Enqueueing anime download links for {anime_name} "
            + f"with range {episode_range}"
        )
        items = await enqueue_range_episodes_download_links_controller(
            episode_links, episode_range, current_user
        )
        process_time = time.time() - start_time
        logger.info(
            f"Enqueued download links for {anime_name} "
            + f"with range {episode_range} in {process_time:.2f} seconds"
        )
        return DownloadJobListOut(
            request_id=request_id,
            process_time=process_time,
            func="enqueue_range_episodes_download_links",
            message="Anime download links enqueued",
            payload=items,
        )
    except Exception as e:
        logger.error(
            f"Error enqueueing anime download links for {anime_name} "
            + f"with range {episode_range}: {e}"
        )
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id,
            message=str(e),
            func="enqueue_range_episodes_download_links",
        )


@animes_router.post(
    "/downloadlinks/force",
    responses={
        200: {"model": DownloadJobOut},
        201: {"model": SuccessResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def force_re_download(
    episode_id: int,
    response: Response,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Force re-downloading episode with id: {episode_id}")
        item = await force_re_download_controller(episode_id)
        process_time = time.time() - start_time

        if item == 201:
            logger.info(
                f"Episode with id: {episode_id} already re-downloading"
            )
            response.status_code = 201
            return SuccessResponse(
                request_id=request_id,
                process_time=process_time,
                func="force_re_download",
                message="Single download link already enqueued",
                status_code=201,
            )

        logger.info(
            f"Re-downloaded episode with id: {episode_id} "
            + f"in {process_time:.2f} seconds"
        )
        return DownloadJobOut(
            request_id=request_id,
            process_time=process_time,
            func="force_re_download",
            message="Single download link enqueued",
            payload=item,
        )
    except Exception as e:
        logger.error(
            f"Error re-downloading episode with id: {episode_id}: {e}"
        )
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id,
            message=str(e),
            func="force_re_download",
        )


@animes_router.post(
    "/downloadlinks/single",
    responses={
        200: {"model": DownloadJobOut},
        201: {"model": SuccessResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def enqueue_single_episode_download_link(
    episode_link: str,
    id: int,
    response: Response,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Enqueueing single download link for {episode_link}")
        item = await enqueue_single_episode_download_links_controller(
            episode_link, id, current_user["sub"]
        )
        process_time = time.time() - start_time

        if item == 201:
            logger.info(
                f"Single download link for {episode_link} already enqueued"
            )
            response.status_code = 201
            return SuccessResponse(
                request_id=request_id,
                process_time=process_time,
                func="enqueue_single_episode_download_link",
                message="Single download link already enqueued",
                status_code=201,
            )

        logger.info(
            f"Got single download link for {episode_link} "
            + f"in {process_time:.2f} seconds"
        )
        return DownloadJobOut(
            request_id=request_id,
            process_time=process_time,
            func="enqueue_single_episode_download_link",
            message="Single download link enqueued",
            payload=item,
        )
    except Exception as e:
        logger.error(
            f"Error enqueueing single download link for {episode_link}: {e}"
        )
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id,
            message=str(e),
            func="enqueue_single_episode_download_link",
        )


@animes_router.get(
    "/episodes/user/{user_id}",
    responses={
        200: {"model": EpisodeDownloadListOut},
        404: {"model": NotFoundResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def get_user_download_episodes(
    user_id: str,
    response: Response,
    request: Request,
    page: int = 0,
    size: int = 10,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Getting download episodes for user {user_id}")
        items = await get_user_download_episodes_controller(
            page, size, user_id
        )
        process_time = time.time() - start_time

        if not items:
            response.status_code = 404
            return NotFoundResponse(
                request_id=request_id,
                process_time=process_time,
                message="No download episodes found",
                func="get_user_download_episodes",
            )

        logger.info(
            f"Got download episodes for user {user_id} in "
            + f"{process_time:.2f} seconds"
        )
        return EpisodeDownloadListOut(
            request_id=request_id,
            process_time=process_time,
            func="get_user_download_episodes",
            message="Download episodes retrieved",
            payload=items,
        )
    except Exception as e:
        logger.error(
            f"Error getting download episodes for user {user_id}: {e}"
        )
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id,
            message=str(e),
            func="get_user_download_episodes",
        )


@animes_router.delete(
    "/episodes/user/{user_id}",
    responses={
        200: {"model": SuccessResponse},
        404: {"model": NotFoundResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def delete_user_download_episodes(
    user_id: str,
    episode_id: int,
    request: Request,
    response: Response,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Deleting download episodes for user {user_id}")
        success = await delete_user_download_episodes_controller(
            user_id, episode_id
        )
        process_time = time.time() - start_time

        if not success:
            response.status_code = 404
            return NotFoundResponse(
                request_id=request_id,
                process_time=process_time,
                message="No download episodes found",
                func="delete_user_download_episodes",
            )

        logger.info(
            f"Got download episodes for user {user_id} in "
            + f"{process_time:.2f} seconds"
        )
        return SuccessResponse(
            request_id=request_id,
            process_time=process_time,
            func="delete_user_download_episodes",
            message="Download episodes deleted",
        )

    except Exception as e:
        logger.error(
            f"Error getting download episodes for user {user_id}: {e}"
        )
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id,
            message=str(e),
            func="delete_user_download_episodes",
        )


@animes_router.get(
    "/downloadlinks/status/{job_id}",
    responses={
        200: {"model": DownloadJobInfoOut},
        404: {"model": NotFoundResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def get_job_info(
    job_id: str,
    request: Request,
    response: Response,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Getting job info for {job_id}")
        item = await get_job_info_controller(job_id)
        process_time = time.time() - start_time

        if not item:
            response.status_code = 404
            return NotFoundResponse(
                request_id=request_id,
                process_time=process_time,
                message="Job not found",
                func="get_job_info",
            )

        logger.info(f"Got job info for {job_id} in {process_time:.2f} seconds")
        return DownloadJobInfoOut(
            request_id=request_id,
            process_time=process_time,
            func="get_job_info",
            message="Job info retrieved",
            payload=item,
        )
    except Exception as e:
        logger.error(f"Error getting job info for {job_id}: {e}")
        process_time = time.time() - start_time
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id,
            process_time=process_time,
            message=str(e),
            func="get_job_info",
        )


@animes_router.get(
    "/episodes/download/{episode_id}",
    response_class=FileResponse,
    responses={
        404: {"model": NotFoundResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def download_episode(
    episode_id: int,
    request: Request,
    response: Response,
    token: str = Depends(verify_token),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Downloading episode with id: {episode_id}")
        download_info = await download_episode_controller(episode_id)
        process_time = time.time() - start_time

        if not download_info:
            response.status_code = 404
            return NotFoundResponse(
                request_id=request_id,
                process_time=process_time,
                message="Episode not found",
                func="download_episode",
            )

        logger.info(
            f"Downloaded episode with id: {episode_id} "
            + f"in {process_time:.2f} seconds"
        )

        return FileResponse(
            download_info[0],
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": "attachment; "
                + f"filename={download_info[1]}.mp4"
            },
        )

    except Exception as e:
        logger.error(f"Error downloading episode with id: {episode_id}: {e}")
        process_time = time.time() - start_time
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id,
            process_time=process_time,
            message=str(e),
            func="download_episode",
        )


@animes_router.get(
    "/saved",
    responses={
        200: {"model": AnimeListOut},
        500: {"model": InternalServerErrorResponse},
    },
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
        anime_card_list = await get_saved_animes_controller(
            current_user["sub"]
        )
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
    responses={
        200: {"model": AnimeOut},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
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
        status, value = await save_anime_controller(
            anime_id, current_user["sub"]
        )
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
    responses={
        200: {"model": AnimeOut},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
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
            anime_id, current_user["sub"]
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
    responses={
        200: {"model": AnimeCacheListOut},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
)
async def get_all_animes_cache(
    response: Response,
    request: Request,
    sort_by: str = None,
    desc: bool = None,
    page: int = 0,
    size: int = 10,
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
        cache = await get_all_animes_cache_controller(
            sort_by, desc, page, size
        )
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
    responses={
        200: {"model": SuccessResponse},
        409: {"model": ConflictResponse},
        500: {"model": InternalServerErrorResponse},
    },
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


@animes_router.get(
    "/utils/statistics/{user_id}",
    responses={
        200: {"model": StatisticsOut},
        500: {"model": InternalServerErrorResponse},
    },
)
async def get_user_statistics(
    user_id: str,
    response: Response,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    start_time = time.time()
    request_id = request.state.request_id
    try:
        logger.info(f"Getting statistics for user {user_id}")
        if not current_user["is_admin"]:
            response.status_code = 409
            return ConflictResponse(
                request_id=request_id,
                func="change_user_status",
                message="Unauthorized",
            )
        stats = await get_user_statistics_controller(user_id)
        process_time = time.time() - start_time
        logger.info(
            f"Got statistics for user {user_id} in {process_time:.2f} seconds"
        )
        return StatisticsOut(
            request_id=request_id,
            process_time=process_time,
            func="get_user_statistics",
            message="User statistics retrieved",
            payload=stats,
        )
    except Exception as e:
        logger.error(f"Error getting statistics for user {user_id}: {e}")
        response.status_code = 500
        return InternalServerErrorResponse(
            request_id=request_id, message=str(e), func="get_user_statistics"
        )
