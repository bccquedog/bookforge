# BookForge API Dockerfile for Railway
FROM python:3.11-slim

# Install system dependencies for WeasyPrint and other libraries
RUN apt-get update && apt-get install -y \
    gcc \
    pandoc \
    python3-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libgdk-pixbuf2.0-dev \
    libffi-dev \
    shared-mime-info \
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
