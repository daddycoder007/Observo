FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S observo -u 1001

# Change ownership
RUN chown -R observo:nodejs /app
USER observo

EXPOSE 3000

CMD ["npm", "start"]