# Stage 1: Build
FROM python:3.12-slim-bookworm AS builder

WORKDIR /app

COPY requirements.txt .

# Install compilers and Python dependencies for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
  gcc libpq-dev libffi-dev libssl-dev libxml2-dev libxslt-dev build-essential \
  && pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir -r requirements.txt \
  && apt-get purge -y --auto-remove gcc build-essential \
  && rm -rf /var/lib/apt/lists/*

# Stage 2: Runtime
FROM python:3.12-slim-bookworm

WORKDIR /app

# Needed libraries for Playwright/Chromium and psycopg2 in runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
  libasound2 libatk-bridge2.0-0 libatk1.0-0 libcairo2 libcups2 libdbus-1-3 \
  libgdk-pixbuf2.0-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxfixes3 \
  libxkbcommon0 libxdamage1 libxrandr2 libgbm1 libxss1 libxtst6 \
  libpq5 \
  && rm -rf /var/lib/apt/lists/*

# Copy compiled Python dependencies
COPY --from=builder /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy the application code
COPY src /app

# Install Chromium for Playwright
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN pip install --no-cache-dir playwright \
  && playwright install chromium


ARG ANIMES_FOLDER

RUN useradd -m appuser \
  && mkdir -p ${ANIMES_FOLDER} \
  && chown -R appuser:appuser ${ANIMES_FOLDER}


EXPOSE 8000

# Execute main.py, which handles Uvicorn internally
CMD ["python", "main.py"]
