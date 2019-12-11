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

EXPOSE 8080

CMD ["node", "./dist/server.js"]
