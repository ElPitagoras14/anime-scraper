# Anime Scraper Frontend

## Description

Anime Scraper Frontend is a web application built with Next.js to display and manage anime data and download links.

## Requirements

- Node.js 14+
- npm or yarn
- Docker (Only for Docker use)
- Run the [Anime Scraper API](/backend/README.md).

## Getting Started

> [!IMPORTANT]
> Ensure that you fill environment variables for the frontend on `.env` and `docker-compose.yaml` files at the root of the project.

### Docker Use

1. Build the image with the following command at the root of the project:

   ```bash
   docker-compose up -d web
   ```

### Development Use

1. Navigate to frontend directory:

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

> [!TIP]
> If you are using `VSCode` you can use the `Run Frontend` task.

The development server should be running at `http://localhost:4000`.
