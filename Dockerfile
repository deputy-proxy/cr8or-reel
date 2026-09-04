FROM node:22-bookworm

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Install the Chromium browser used by Remotion.
RUN npx remotion browser ensure

RUN mkdir -p /app/tmp && chown -R node:node /app

USER node

ENV NODE_ENV=production
ENV PORT=3000
ENV RENDER_SECRET=

EXPOSE 3000

CMD ["node", "src/server.js"]