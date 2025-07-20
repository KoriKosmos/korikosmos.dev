
FROM node:18

# Install git and nginx
RUN apt-get update \
 && apt-get install -y git nginx \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies separately so they can be cached
COPY package*.json ./
RUN npm install

# Copy the rest of the repo
COPY . .

# Include entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80
CMD ["/usr/local/bin/docker-entrypoint.sh"]
