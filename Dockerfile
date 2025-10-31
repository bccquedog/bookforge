# BookForge API Dockerfile for Railway
FROM python:3.11-slim

# Install system dependencies for WeasyPrint and other libraries
RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-cffi \
    python3-brotli \
    libpango1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz-subset0 \
    libffi-dev \
    libcairo2 \
    libcairo2-dev \
    libjpeg62-turbo-dev \
    libgdk-pixbuf2.0-0 \
    libgdk-pixbuf2.0-dev \
    libgobject-2.0-0 \
    libgobject-2.0-dev \
    gcc \
    pandoc \
    python3-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for library paths
ENV LD_LIBRARY_PATH=/usr/lib:/usr/local/lib:/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH

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
