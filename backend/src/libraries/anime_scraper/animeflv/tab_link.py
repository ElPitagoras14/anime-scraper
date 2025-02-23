from playwright.async_api import Page

from libraries.anime_scraper.animeflv.config import TIMEOUT, SW_DOWNLOAD_URL


async def get_sw_link(page: Page, search_page: Page):
    video_element = await page.wait_for_selector(
        "div#video_box", timeout=TIMEOUT
    )
    iframe_element = await video_element.query_selector("iframe")
    iframe_src = await iframe_element.get_attribute("src")
    video_id = iframe_src.split("/")[-1].split("?")[0]

    try_links = [
        f"{SW_DOWNLOAD_URL}/{video_id}_h",
        f"{SW_DOWNLOAD_URL}/{video_id}_n",
    ]

    for link in try_links:
        try:
            await search_page.goto(link)
            download_button = await search_page.wait_for_selector(
                "button", timeout=TIMEOUT
            )
            await download_button.click()

            download_link = await search_page.wait_for_selector(
                "a.dwnlonk", timeout=TIMEOUT
            )
            download_link = await download_link.get_attribute("href")

            return download_link
        except Exception:
            continue

    return None


async def get_yourupload_link(page: Page, search_page: Page):
    video_element = await page.wait_for_selector(
        "div#video_box", timeout=TIMEOUT
    )
    iframe_element = await video_element.query_selector("iframe")
    iframe_src = await iframe_element.get_attribute("src")

    await search_page.goto(iframe_src)

    video_element = await search_page.wait_for_selector(
        "video", timeout=TIMEOUT
    )
    video_src = await video_element.get_attribute("src")

    return video_src


get_tab_download_link = {
    "SW": get_sw_link,
    "YourUpload": get_yourupload_link,
}
