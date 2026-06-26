# All submissions must be containerized. Single image: engine + harness + dashboard.
FROM python:3.11-slim

WORKDIR /app
ENV PYTHONPATH=/app PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x docker-entrypoint.sh

EXPOSE 8000
# Seeds a mock run so the dashboard has data, then serves API + dashboard.
ENTRYPOINT ["./docker-entrypoint.sh"]
