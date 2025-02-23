import asyncio
from datetime import datetime
import aiohttp
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

from libraries.anime_scraper.base import BaseAnimeScraper
from libraries.anime_scraper.schemas import (
    AnimeInfo,
    DownloadLink,
    DownloadRangeLink,
    SearchAnimeInfo,
    StreamingLink,
)

from libraries.anime_scraper.animeflv.config import BASE_URL, TIMEOUT
from libraries.anime_scraper.animeflv.utils import (
    close_not_allowed_popups,
    get_anime_cards,
    get_order_idx,
)
from libraries.anime_scraper.animeflv.tab_link import get_tab_download_link
from libraries.anime_scraper.animeflv.table_link import (
    get_streamtape_download_link,
)


class AnimeFLVScraper(BaseAnimeScraper):
    def __init__(self, concurrent_limit: int = 6):
        super().__init__(concurrent_limit)

    async def search_anime(self, query: str) -> list[SearchAnimeInfo]:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                BASE_URL + f"/browse?q={query}"
            ) as response:
                page = await response.text()
                soup = BeautifulSoup(page, "html.parser")
                pagination = soup.find_all("div", class_="NvCnAnm")[0]
                total = int(len(pagination.find_all("li"))) - 2
                anime_list = []
                anime_list += get_anime_cards(page)

                if total > 1:
                    for i in range(2, total + 1):
                        async with session.get(
                            BASE_URL + f"/browse?q={query}&page={i}"
                        ) as response:
                            page = await response.text()
                            anime_list += get_anime_cards(page)
                return anime_list

    async def get_emission_date(self, anime: str) -> str:
        async with async_playwright() as p:

            browser = await p.chromium.launch()
            page = await browser.new_page()
            await page.goto(f"{BASE_URL}/anime/{anime}")

            episodes_box = await page.wait_for_selector(
                "#episodeList", timeout=TIMEOUT
            )
            episodes = await episodes_box.query_selector_all(
                "li.fa-play-circle"
            )
            emission_row = episodes[0]
            a_element = await emission_row.query_selector("a")
            span_element = await a_element.query_selector("span")
            emission_date = await span_element.inner_text()

            await browser.close()

            week_day = datetime.strptime(emission_date, "%Y-%m-%d")
            week_day = week_day.strftime("%A")

            return week_day

    async def get_anime_info(self, anime: str) -> AnimeInfo:
        async with aiohttp.ClientSession() as session:
            async with session.get(BASE_URL + f"/anime/{anime}") as response:
                page = await response.text()
                soup = BeautifulSoup(page, "html.parser")
                name = soup.find("h1").text
                cover = soup.find_all("div", class_="AnimeCover")[0].find(
                    "img"
                )["src"]
                cover_url = BASE_URL + cover
                is_finished = soup.find_all("p", class_="AnmStts")[0].text
                is_finished = is_finished == "Finalizado"
                description = soup.find_all("div", class_="Description")[
                    0
                ].text
                parsed_description = description.replace("\n", "").strip()

                new_week_day = None
                if not is_finished:
                    new_week_day = await self.get_emission_date(anime)

                return {
                    "anime_id": anime,
                    "name": name,
                    "cover_url": cover_url,
                    "is_finished": is_finished,
                    "description": parsed_description,
                    "emission_date": new_week_day,
                }

    async def get_streaming_links(
        self, anime: str, last_episode: str = None
    ) -> list[StreamingLink]:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            await page.goto(f"{BASE_URL}/anime/{anime}")
            episodes_box = await page.wait_for_selector(
                "#episodeList", timeout=TIMEOUT
            )

            idx = 0
            all_episodes = []
            while True:
                all_episodes = await episodes_box.query_selector_all(
                    "li.fa-play-circle:not(.Next)"
                )

                if last_episode:
                    found = False
                    for episode in all_episodes[idx:]:
                        a_element = await episode.query_selector("a")
                        p_element = await a_element.query_selector("p")
                        episode_name = await p_element.inner_text()
                        if episode_name.strip() == last_episode:
                            found = True
                            break
                        idx += 1

                    if found:
                        break

                previous_rows_len = len(all_episodes)

                await episodes_box.evaluate(
                    """(element) => {
                        element.scrollBy(0, element.scrollHeight);
                    }"""
                )

                await page.wait_for_timeout(500)

                current_row_len = len(
                    await episodes_box.query_selector_all(
                        "li.fa-play-circle:not(.Next)"
                    )
                )

                if current_row_len == previous_rows_len:
                    idx = current_row_len
                    break

            if idx == 0:
                await browser.close()
                return []

            selected_episodes = all_episodes[:idx]

            episodes_info = []
            for episode in selected_episodes:
                a_element = await episode.query_selector("a")
                p_element = await a_element.query_selector("p")
                episode_name = await p_element.inner_text()
                episode_link = await a_element.get_attribute("href")
                episodes_info.append(
                    {
                        "link": f"{BASE_URL}{episode_link}",
                        "name": episode_name,
                    }
                )

            await browser.close()

            episodes_info.reverse()
            return episodes_info

    async def get_download_link(self, episode_link: str) -> DownloadLink:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            context = await browser.new_context(ignore_https_errors=True)

            page = await context.new_page()
            page.on("popup", close_not_allowed_popups)

            search_page = await context.new_page()
            search_page.on("popup", close_not_allowed_popups)

            await page.goto(episode_link)

            name_container = await page.query_selector_all("h2")
            name = await name_container[0].inner_text()

            download_table = await page.wait_for_selector(
                "table.Dwnl", timeout=TIMEOUT
            )
            download_options = await download_table.query_selector_all("a")
            download_links = [
                await download_option.get_attribute("href")
                for download_option in download_options
            ]

            navbar_element = await page.wait_for_selector(
                "ul[role='tablist']", timeout=TIMEOUT
            )
            tabs = await navbar_element.query_selector_all("li")
            tab_names = [
                {
                    "title": await tab.get_attribute("title"),
                    "tab": await tab.query_selector("a"),
                }
                for tab in tabs
            ]
            order_idx = get_order_idx(tab_names)

            for link in download_links:
                try:
                    if "mega" in link or "fichier" in link:
                        continue
                    if "streamtape" in link:
                        parsed_link = await get_streamtape_download_link(
                            search_page, link
                        )
                        if not parsed_link:
                            continue

                        await context.close()
                        await browser.close()

                        return {
                            "name": name,
                            "download_info": {
                                "service": "streamtape",
                                "link": parsed_link,
                            },
                        }

                except Exception:
                    continue

            for idx in order_idx:
                try:
                    service = tab_names[idx].get("title")

                    tab = tab_names[idx].get("tab")
                    await tab.click()
                    await tab.click()

                    get_fn = get_tab_download_link.get(service, None)
                    if not get_fn:
                        continue

                    download_link = await get_fn(page, search_page)
                    if not download_link:
                        continue

                    await context.close()
                    await browser.close()

                    return {
                        "name": name,
                        "download_info": {
                            "service": service,
                            "link": download_link,
                        },
                    }
                except Exception:
                    continue

            await context.close()
            await browser.close()

            return {
                "name": name,
                "download_info": None,
            }

    async def __limit_concurrent_download_link(
        self, episode_link: str, semaphore: asyncio.Semaphore
    ) -> dict[str, str] | None:
        async with semaphore:
            return await self.get_download_link(episode_link)

    async def get_range_download_links(
        self, episode_info: list[str]
    ) -> list[DownloadRangeLink]:
        pass
        results = []
        tasks = []
        request_semaphore = asyncio.Semaphore(self.concurrent_limit)
        for episode in episode_info:
            episode_link = episode
            task = self.__limit_concurrent_download_link(
                episode_link, request_semaphore
            )
            tasks.append(task)

        results = await asyncio.gather(*tasks)

        download_links = []
        for i in range(len(results)):
            download_info = results[i]
            if not download_info:
                download_links.append({})
                continue
            download_links.append(download_info)

        return download_links
