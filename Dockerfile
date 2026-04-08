# Base image optimized for Node applications
FROM node:20-alpine AS build

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Bundle app source
COPY . .

# Production image
FROM node:20-alpine

# Use an unprivileged user
USER node

WORKDIR /usr/src/app

COPY --from=build --chown=node:node /usr/src/app ./

# Default port
EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]