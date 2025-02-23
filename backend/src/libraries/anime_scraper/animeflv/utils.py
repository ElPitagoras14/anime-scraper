from bs4 import BeautifulSoup
from playwright.async_api import Page

preference_order_tabs = [
    "SW",
    "YourUpload",
]

allowed_popups = [
    "www.yourupload.com",
]


def get_anime_cards(page: str):
    soup = BeautifulSoup(page, "html.parser")
    anime_list = []
    anime_container = soup.find_all(
        "ul", class_="ListAnimes AX Rows A03 C02 D02"
    )[0].find_all("li")
    for anime in anime_container:
        name = anime.find("h3").text
        anime_id = anime.find("a")["href"].split("/")[-1]
        cover = anime.find("img")["src"]
        cover_url = cover
        anime_list.append(
            {"name": name, "cover_url": cover_url, "anime_id": anime_id}
        )
    return anime_list


def get_order_idx(current_tabs: list[dict]) -> list[int]:
    current_tabs = {tab["title"]: idx for idx, tab in enumerate(current_tabs)}

    order_idx = []
    for tab in preference_order_tabs:
        if tab in current_tabs:
            order_idx.append(current_tabs[tab])

    return order_idx


async def close_not_allowed_popups(page: Page):
    await page.wait_for_load_state("domcontentloaded")
    allowed = False
    for allowed_popup in allowed_popups:
        if allowed_popup in page.url:
            allowed = True
            break

    if not allowed:
        await page.close()
