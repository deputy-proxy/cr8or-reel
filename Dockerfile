FROM node:22-bookworm

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# FFmpeg plus the shared libraries required by Remotion's Chrome headless shell.
# Installing Debian's Chromium package pulls in the full runtime dependency set,
# including libnspr4/libnss3 and the graphics/audio libraries Chrome expects.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        chromium \
    && rm -rf /var/lib/apt/lists/*

# Download the browser binary used by Remotion.
RUN npx remotion browser ensure

RUN mkdir -p /app/tmp && chown -R node:node /app

USER node

ENV NODE_ENV=production
ENV PORT=3000
ENV RENDER_CONCURRENCY=4

EXPOSE 3000

CMD ["node", "src/server.js"]
