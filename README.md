# Anime Scraper Frontend

## Description

Anime Scraper Frontend is a web application built with Next.js to display and manage anime data and download links.

## Requirements

- Node.js 14+
- npm or yarn
- Docker (Only for Docker use)
- Run the [Anime Scraper API](https://github.com/ElPitagoras14/scrap-anime-api).

## Getting Started

### Docker Use

1. Clone the repository:

   ```bash
   git clone https://github.com/ElPitagoras14/anime-scraper-frontend.git
   cd anime-scraper-frontend
   ```

2. Rename `docker-compose.yaml.example` to `docker-compose.yaml` and `.env.local.example` to `.env.local`.

3. Fill the environment variables in `docker-compose.yaml` and `.env.local` according to [Environment Variables](#environment-variables) section.

> [!IMPORTANT]
> If you set the `NEXT_PUBLIC_BACKEND_URL` env variable with the backend container name. You need to set a custom host in your computer. Check [this section](#set-custom-host) for more info.

4. Build the image:

   ```bash
   docker-compose up -d
   ```

The server should be running at `http://127.0.0.1:3000`.

### Development Use

1. Clone the repository:

   ```bash
   git clone https://github.com/ElPitagoras14/anime-scraper-frontend.git
   cd anime-scraper-frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

The development server should be running at `http://127.0.0.1:3000`.

## Roadmap

- [ ] Write the Roadmap

## Environment Variables

- `NODE_ENV` - The environment of aplication. Default: `production`
- `NEXT_PUBLIC_BACKEND_URL` - The url of `Anime Scraper API` for the browser host. If you use an external network for the frontend and backend, you can use the container name as the domain, for example: `http://scraper-api:8000` and set the custom host resolution. Otherwise you can use `http://localhost:8000`.
- `NEXT_PUBLIC_SERVER_BACKEND_URL` - The url of `Anime Scraper API` for the Docker container. Use the external netwok and set it to `http://scraper-api:8000`.
- `NEXTAUTH_URL` - The url of `Anime Scraper Web`. Default: `http://localhost:3000`.
- `NEXTAUTH_SECRET` - Secret key for `NextAuth.js`.

## Set Custom Host

### Windows

1. Open Notepad as administrator.

2. Open the host file with `File > Open` and navigate to `C:\Windows\System32\drivers\etc\hosts`.

3. Add the custom entry at the end of the file:

   ```bash
   127.0.0.1    scraper-api
   ```

4. Save the file.

### Linux

1. Open the terminal.

2. Use the following command to edit the host file:

   ```bash
   sudo nano /etc/hosts
   ```

3. Add the custom entry at the end of the file:

   ```bash
   127.0.0.1    scraper-api
   ```

4. Save the file.

## Author

- [Jonathan García](https://github.com/ElPitagoras14) - Computer Science Engineer
