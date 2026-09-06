FROM node:22-bookworm

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build:preview && test -f public/renderer-preview/index.html

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        chromium \
        libegl1 \
        libgl1 \
        libgles2 \
        mesa-vulkan-drivers \
    && rm -rf /var/lib/apt/lists/*

RUN npx remotion browser ensure

RUN npm prune --omit=dev

RUN mkdir -p /app/tmp && chown -R node:node /app

USER node

ENV NODE_ENV=production
ENV PORT=3000
ENV RENDER_CONCURRENCY=4
ENV REMOTION_GL=angle

EXPOSE 3000

CMD ["node", "src/server.js"]
