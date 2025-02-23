from playwright.async_api import Page

from libraries.anime_scraper.animeflv.config import TIMEOUT


async def get_streamtape_download_link(page: Page, link: str):
    await page.goto(link)
    video_element = await page.wait_for_selector("video", timeout=TIMEOUT)
    video_src = await video_element.get_attribute("src")

    return f"https:{video_src}"
