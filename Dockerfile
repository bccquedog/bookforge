# BookForge API Dockerfile for Railway
FROM python:3.11-slim

# Install system dependencies for WeasyPrint and other libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    python3-pip \
    libcairo2 \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-xlib-2.0-0 \
    libffi-dev \
    shared-mime-info \
    pandoc \
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
