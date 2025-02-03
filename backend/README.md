# Anime Scraper API

## Description

Anime Scraper API is a project built with FastAPI to scrape anime data and download links.

## Requirements

- Python 3.7+
- pip
- Docker (Only for Docker use)
- Postgres Database
- Redis Database

## Getting Started

> [!IMPORTANT]
> Ensure that you fill environment variables for backend utilities on `.env` and `docker-compose.yaml` files at the root of the project.

### Docker Use

1. Build the image with the following command at the root of the project:

   ```bash
   docker-compose up -d api
   ```

The server should be running at `http://localhost:4002`.

### Development Use

1. Create a virtual environment (optional but recommended):

   ```bash
   python -m venv env
   source env/bin/activate # For Linux based
   env\Scripts\activate # For Windows based
   ```

2. Run the following command:

   ```bash
   pip install -r requirements.txt
   ```

3. Make sure your virtual environment is activated (if you created one).

4. Navigate to the `backend/src` folder and run the script:

   ```bash
   python main.py
   ```

5. Navigate to the `backend/src` folder and run the command:

   ```bash
   celery -A queues.client worker --loglevel=INFO -E
   ```

> [!TIP]
> If you are using `VSCode` you can use the `Run Backend` and `Add Workers` tasks.

The server should be running at `http://localhost:4002`.

### Postgres (For Development)

1. Create a Postgres Database with the following command at the root of the project:

   ```bash
   docker-compose up -d db
   ```


### Redis (For Development)

1. Create a Postgres Database with the following command at the root of the project:

   ```bash
   docker-compose up -d redis
   ```

## Usage

You can access the automatically generated FastAPI documentation at `http://localhost:4002/docs`.
