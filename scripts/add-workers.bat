cd backend/src

celery -A queues.client worker --loglevel=INFO -E