from playwright.async_api import Page

TIMEOUT = 10000

preference_order_tabs = [
    "SW",
    "YourUpload",
]

allowed_popups = [
    "www.yourupload.com",
]


def get_order_idx(current_tabs: list[dict]) -> list[int]:
    current_tabs = {tab["title"]: idx for idx, tab in enumerate(current_tabs)}

    order_idx = []
    for tab in preference_order_tabs:
        if tab in current_tabs:
            order_idx.append(current_tabs[tab])

    return order_idx


def parse_episode_range(episodes_range):
    episodes = []
    ranges = episodes_range.split(",")
    seen = set()
    for item in ranges:
        if "-" in item:
            start, end = map(int, item.split("-"))
            if start < 1 or end < 1:
                continue
            for episode_num in range(start, end + 1):
                if episode_num not in seen:
                    episodes.append(episode_num)
                    seen.add(episode_num)
        else:
            parts = item.split()
            for part in parts:
                episode_num = int(part)
                if episode_num >= 1 and episode_num not in seen:
                    episodes.append(episode_num)
                    seen.add(episode_num)
    return episodes


async def close_not_allowed_popups(page: Page):
    await page.wait_for_load_state("domcontentloaded")
    allowed = False
    for allowed_popup in allowed_popups:
        if allowed_popup in page.url:
            allowed = True
            break

    if not allowed:
        await page.close()
