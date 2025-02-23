from abc import ABC, abstractmethod

from libraries.anime_scraper.schemas import (
    DownloadRangeLink,
    SearchAnimeInfo,
    AnimeInfo,
    StreamingLink,
    DownloadLink,
)


class BaseAnimeScraper(ABC):
    def __init__(self, concurrent_limit: int):
        self.concurrent_limit = concurrent_limit

    @abstractmethod
    async def search_anime(self, query: str) -> list[SearchAnimeInfo]:
        pass

    @abstractmethod
    async def get_anime_info(self, anime: str) -> AnimeInfo:
        pass

    @abstractmethod
    async def get_emission_date(self, anime: str) -> str:
        pass

    @abstractmethod
    async def get_streaming_links(
        self, anime: str, last_episode: str
    ) -> list[StreamingLink]:
        pass

    @abstractmethod
    async def get_download_link(self, episode_link: str) -> DownloadLink:
        pass

    @abstractmethod
    async def get_range_download_links(
        self, episode_links: list[str]
    ) -> list[DownloadRangeLink]:
        pass
