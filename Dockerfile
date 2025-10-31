# BookForge API Dockerfile for Railway
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    pandoc \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy API directory
COPY api/ ./api/

# Install Python dependencies
WORKDIR /app/api
RUN pip install --no-cache-dir -r requirements.txt

# Expose port (Railway will set PORT env var)
EXPOSE 8000

# Start server
CMD ["python3", "server.py"]
