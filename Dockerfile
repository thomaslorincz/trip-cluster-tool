FROM node:12

# Create app directory
WORKDIR /usr/src/app

# Copy codebase
COPY . .

# Install app dependencies
RUN npm ci --only=production

# Build/bundle source code
RUN npm run build:prod

EXPOSE 8080

CMD ["node", "./dist/server.js"]
