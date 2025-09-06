FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Expose port
EXPOSE 4000

# Environment defaults (override in compose or env)
ENV NODE_ENV=production

# Start
CMD ["node", "server.js"]
