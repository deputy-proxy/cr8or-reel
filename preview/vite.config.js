import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(process.cwd(), 'preview'),
  base: '/preview/',
  server: { port: 4173 },
  build: {
    outDir: path.resolve(process.cwd(), 'public/renderer-preview'),
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(process.cwd(), 'preview/index.html') }
  }
});
