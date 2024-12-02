# Anime Scraper Monorepo

## Description

**Anime Scraper** is a complete system for scraping, managing, and interacting with anime data. It consists of two core components:

- [**Anime Scraper API**:](/backend/README.md) A backend service built with FastAPI that handles data scraping, processing, and storage. It provides a structured API to retrieve and manage anime information and download links.

- [**Anime Scraper Frontend**:](/frontend/README.md) A web application developed with Next.js that allows users to interact with the scraped data, manage collections, and access download links in an intuitive interface.

Together, these components create a seamless solution for anime enthusiasts, simplifying the discovery and management of anime-related resources while offering a customizable and scalable platform.

## Requirements

- **General**:
  - Docker
- **API**:
  - Python 3.7+
  - pip
  - PostgreSQL
- **Frontend**:
  - Node.js 14+
  - npm or yarn

## Getting Started

> [!IMPORTANT]
> Rename `.env.example` to `.env` and fill it.
> Ensure that you fill environment variables on `.env` file at the root of the project.

### Docker Use

1. Clone this repository:

   ```bash
   git clone https://github.com/ElPitagoras14/anime-scraper.git
   cd anime-scraper
   ```

2. Build the images with the following command at the root of project:

   ```bash
   docker-compose up -d
   ```

> [!TIP]
> If you are using `VSCode` you can use the `Deploy with docker-compose` task.

### Development Use

> [!IMPORTANT]
> You need a running `postgres` database for your backend.

Follow the specifir instruction for each project `Backend` and `Frontend` in their respective `README` files.

> [!TIP]
> If you are using `VSCode` you can use the `Setup Dev Env`, `Run Backend` and `Run Frontend` tasks.

## Author

- [Jonathan García](https://github.com/ElPitagoras14) - Computer Science Engineer
