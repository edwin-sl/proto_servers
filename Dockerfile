# Lightweight Node image
FROM node:24-alpine

# Create app directory
WORKDIR /app

# Install dependencies (use package-lock if present for reproducible builds)
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Default environment variables (can be overridden at runtime)
ENV HTTP_PORT=3000 \
    WS_PORT=8080 \
    GRPC_PORT=50051 \
    MQTT_PORT=1883 \
    MQTT_URL="mqtt://test.mosquitto.org"

# Expose common ports (these are defaults; container ports can be remapped)
EXPOSE 3000 8080 50051 1883

# Start the server
CMD ["node", "src/index.js"]
