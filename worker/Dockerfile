FROM node:20-alpine

# Install tools for custom runners and Docker communication
RUN apk add --no-cache docker-cli bash curl unzip && \
    npm install -g tsx

WORKDIR /app

COPY package*.json ./
# Install all deps (including devDeps like typescript) for build
RUN npm ci

COPY . .
RUN npm run build

# Prune dev dependencies to keep image small
RUN npm prune --production

# Create directory for hidden tests
RUN mkdir -p /app/hidden-tests

CMD ["node", "dist/index.js"]
