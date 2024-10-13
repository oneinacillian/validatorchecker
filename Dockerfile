# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm-dev \
    libnss3 \
    lsb-release \
    wget \
    xdg-utils \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Install Puppeteer and Axios
RUN npm install puppeteer axios

# Copy the Puppeteer scripts into the container
COPY fetch_chain_api_validationcore.js /app/fetch_chain_api_validationcore.js
COPY fetch_chain_api_ledger.js /app/fetch_chain_api_ledger.js
COPY fetch_chain_api_sentnl.js /app/fetch_chain_api_sentnl.js
COPY entrypoint.sh /app/entrypoint.sh

# Ensure the entrypoint script is executable
RUN chmod +x /app/entrypoint.sh

# Set the entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]
