# Use phusion/baseimage as base image
FROM phusion/baseimage:noble-1.0.2

# Use baseimage-docker's init system
CMD ["/sbin/my_init"]

# Install Python 3.12 and dependencies
RUN apt-get update && \
    apt-get install -y \
        python3-pip \
        nginx ca-certificates \
        curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Update CA certificates
RUN update-ca-certificates

# Create application directories
RUN mkdir -p /app/transfere-gov /app/transfere-gov-especiais

# Copy and install dependencies for both services
COPY vendor/backend-transfere-gov/requirements.txt /app/transfere-gov/requirements.txt
COPY vendor/backend-transfere-gov-especiais/api/requirements.txt /app/transfere-gov-especiais/requirements.txt

RUN python3.12 -m pip install --break-system-packages --no-cache-dir -r /app/transfere-gov/requirements.txt && \
    python3.12 -m pip install --break-system-packages --no-cache-dir -r /app/transfere-gov-especiais/requirements.txt

# Copy application code
COPY vendor/backend-transfere-gov/ /app/transfere-gov/
COPY vendor/backend-transfere-gov-especiais/api/ /app/transfere-gov-especiais/

# Create runit service for transfere-gov (port 8001)
RUN mkdir /etc/service/transfere-gov
COPY services/transfere-gov/run /etc/service/transfere-gov/run
RUN chmod +x /etc/service/transfere-gov/run

# Create runit service for transfere-gov-especiais (port 8002)
RUN mkdir /etc/service/transfere-gov-especiais
COPY services/transfere-gov-especiais/run /etc/service/transfere-gov-especiais/run
RUN chmod +x /etc/service/transfere-gov-especiais/run

# Create runit service for nginx
RUN mkdir /etc/service/nginx
COPY services/nginx/run /etc/service/nginx/run
RUN chmod +x /etc/service/nginx/run

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/sites-available/default /etc/nginx/sites-available/default

# Remove default nginx site and enable our configuration
RUN rm -f /etc/nginx/sites-enabled/default && \
    ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Create log directories
RUN mkdir -p /var/log/transfere-gov /var/log/transfere-gov-especiais

# Expose port 80 for nginx
EXPOSE 80

# Set environment variables para o transfere-gov-especiais
ENV ID_BENEFICIARIO=3445
ENV CACHE_TTL_SECONDS=3600

# Final clean
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*