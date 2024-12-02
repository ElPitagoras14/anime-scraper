import asyncio
import sys

from datetime import datetime
from playwright.async_api import async_playwright
from loguru import logger

from .utils import (
    get_order_idx,
    close_not_allowed_popups,
    parse_episode_range,
    TIMEOUT,
)
from .tab_link import get_tab_download_link
from .table_link import get_streamtape_download_link

ANIME_HOST = "https://www3.animeflv.net"

CONCURRENT_APP = 32
CONCURRENT_PER_REQUEST = 4

global_semaphore = asyncio.Semaphore(CONCURRENT_APP)

logger.remove(0)
logger.add(
    sys.stdout, format="{time} | {level} | {message} | {extra}", level="INFO"
)


async def get_streaming_links(
    anime: str, last_episode=None
) -> list[dict[str, str]]:
    async with async_playwright() as p:
        logger.info(f"Getting streaming links for {anime}")

        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto(f"{ANIME_HOST}/anime/{anime}")
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

            logger.debug(
                f"Current found {current_row_len} episodes for {anime}"
            )

            if current_row_len == previous_rows_len:
                idx = current_row_len
                break

        if idx == 0:
            logger.debug(f"No new episodes found for {anime}")
            await browser.close()
            return []

        selected_episodes = all_episodes[:idx]

        logger.debug(f"Found {len(selected_episodes)} episodes for {anime}")

        episodes_info = []
        for episode in selected_episodes:
            a_element = await episode.query_selector("a")
            p_element = await a_element.query_selector("p")
            episode_name = await p_element.inner_text()
            episode_link = await a_element.get_attribute("href")
            episodes_info.append(
                {
                    "link": f"{ANIME_HOST}{episode_link}",
                    "name": episode_name,
                }
            )

        await browser.close()

        episodes_info.reverse()
        return episodes_info


async def get_single_episode_download_link(
    episode_link: str,
) -> dict[str, str] | None:
    async with global_semaphore:
        anime_episode_id = episode_link.split("/")[-1]
        async with async_playwright() as p:
            logger.info(f"Getting download link for {anime_episode_id}")

            browser = await p.chromium.launch()
            context = await browser.new_context(ignore_https_errors=True)

            page = await context.new_page()
            page.on("popup", close_not_allowed_popups)

            search_page = await context.new_page()
            search_page.on("popup", close_not_allowed_popups)

            await page.goto(episode_link)

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
                        logger.debug(
                            f"Found download link for {anime_episode_id} "
                            + "in streamtape"
                        )
                        return {"service": "streamtape", "link": parsed_link}

                except Exception:
                    continue

            for idx in order_idx:
                try:
                    service = tab_names[idx].get("title")

                    logger.debug(
                        f"Trying to get download link for {anime_episode_id} "
                        + f"at service {service}"
                    )

                    tab = tab_names[idx].get("tab")
                    await tab.click()
                    await tab.click()

                    get_fn = get_tab_download_link.get(service, None)
                    if not get_fn:
                        continue

                    download_link = await get_fn(page, search_page)
                    if not download_link:
                        continue

                    logger.debug(
                        f"Found download link for {anime_episode_id} "
                        + f"at service {service}"
                    )
                    return {"service": service, "link": download_link}
                except Exception:
                    continue

            await context.close()
            await browser.close()


async def _limit_concurrent_download_link(
    episode_link: str, semaphore: asyncio.Semaphore
) -> dict[str, str] | None:
    async with semaphore:
        return await get_single_episode_download_link(episode_link)


async def get_range_episodes_download_links(
    episode_links: list[dict], episodes_range=None
) -> dict[str, str | list]:
    episodes = (
        parse_episode_range(episodes_range)
        if episodes_range
        else range(1, len(episode_links) + 1)
    )
    logger.info(f"Getting download links for episodes {episodes}")

    results = []
    tasks = []
    request_semaphore = asyncio.Semaphore(CONCURRENT_PER_REQUEST)
    for idx in episodes:
        episode_link = episode_links[idx - 1]["link"]
        task = _limit_concurrent_download_link(episode_link, request_semaphore)
        tasks.append(task)

    results = await asyncio.gather(*tasks)

    download_links = []
    not_valid_cnt = 0
    for idx, download_link in enumerate(results, 1):
        if not download_link:
            not_valid_cnt += 1
            continue
        download_links.append(
            {
                "name": episode_links[idx - 1]["name"],
                "download_info": (
                    {
                        "service": download_link["service"],
                        "link": download_link["link"],
                    }
                    if download_link
                    else None
                ),
                "episode": idx,
            }
        )

    anime = "-".join(episode_links[0]["link"].split("/")[-1].split("-")[:-1])
    anime_download_info = {
        "anime": anime,
        "download_links": download_links,
    }
    logger.debug(
        f"Found {len(download_links) - not_valid_cnt} "
        + f"download links for {anime}"
    )
    return anime_download_info


async def get_emission_date(anime: str) -> str:
    async with async_playwright() as p:
        logger.info(f"Getting emission date for {anime}")

        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto(f"{ANIME_HOST}/anime/{anime}")

        episodes_box = await page.wait_for_selector(
            "#episodeList", timeout=TIMEOUT
        )
        episodes = await episodes_box.query_selector_all("li.fa-play-circle")
        emission_row = episodes[0]
        a_element = await emission_row.query_selector("a")
        span_element = await a_element.query_selector("span")
        emission_date = await span_element.inner_text()

        await browser.close()

        week_day = datetime.strptime(emission_date, "%Y-%m-%d")
        week_day = week_day.strftime("%A")

        logger.debug(f"Found emission date for {anime}: {week_day}")
        return week_day
