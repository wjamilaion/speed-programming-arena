FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

RUN mkdir -p /app/uploads

EXPOSE 3001

CMD ["node", "dist/main"]
