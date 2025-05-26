FROM python:3.12-slim-bookworm

WORKDIR /app

COPY requirements.txt /app

RUN apt-get update && apt-get install -y --no-install-recommends \
  # Dependencias para Playwright/Chromium
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxfixes3 \
  libxkbcommon0 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libxss1 \
  libxtst6 \
  \
  # Dependencias de compilación y librerías nativas para Python
  gcc \
  libpq-dev \
  libxml2-dev \
  libxslt-dev \
  libffi-dev \
  libssl-dev \
  build-essential \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*


RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir -r requirements.txt

COPY src /app

RUN playwright install chromium

EXPOSE 8000

CMD ["python", "main.py"]
