FROM node:22-bookworm

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN npx remotion browser ensure

RUN mkdir -p /app/tmp && chown -R node:node /app

USER node

ENV NODE_ENV=production
ENV PORT=3000
ENV RENDER_CONCURRENCY=4

EXPOSE 3000

CMD ["node", "src/server.js"]
