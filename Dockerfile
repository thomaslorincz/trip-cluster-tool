FROM node:12

# Create app directory
WORKDIR /usr/src/app

# Copy codebase
COPY . .

# Install app dependencies
RUN npm ci

# Build/bundle source code
RUN npm run build:prod

# Prune dev dependencies
RUN npm prune --production

# Install production process manager
RUN npm install -g pm2

EXPOSE 8080

CMD ["pm2-runtime", "ecosystem.config.js"]
