from libraries.anime_scraper.animeflv.scraper import AnimeFLVScraper


class ScraperFactory:
    SCRAPERS = {
        "animeflv": AnimeFLVScraper,
        "jkanime": None,
    }

    @staticmethod
    def get_scraper(scraper_name: str):
        scraper_class = ScraperFactory.SCRAPERS.get(scraper_name.lower())
        if not scraper_class:
            raise ValueError(f"Scraper {scraper_name} not found")
        return scraper_class()
