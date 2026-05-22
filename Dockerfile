# Use the official lightweight Python image.
# https://hub.docker.com/_/python
FROM python:3.11-slim

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED True

# Set working directory inside the container
WORKDIR /app

# Copy all project files (frontend, backend, etc.) to the container
COPY . ./

# Install python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Cloud Run injects the PORT environment variable. We default to 8080.
ENV PORT=8080

# Expose the default port
EXPOSE 8080

# Start the FastAPI application. We execute uvicorn pointing to the main file inside the backend directory,
# and dynamically read the PORT environment variable.
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
