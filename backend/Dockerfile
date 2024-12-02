FROM python:3.12

WORKDIR /app

COPY src /app/src
COPY requirements.txt /app

RUN mkdir -p /var/log/scraper-anime

RUN pip install -r requirements.txt
RUN playwright install chromium
RUN playwright install-deps

EXPOSE 8000

CMD ["sh", "-c", "cd src && python main.py"]
