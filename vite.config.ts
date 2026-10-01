import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';

// ----------------------------------------------------------------------

const PORT = 4173;
const ADMIN_API_TARGET = 'http://127.0.0.1:1208';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
      },
      overlay: {
        position: 'tl',
        initialIsOpen: false,
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: /^src(.+)/,
        replacement: path.resolve(process.cwd(), 'src/$1'),
      },
    ],
  },
  server: {
    port: PORT,
    host: true,
    proxy: { '/admin': { target: ADMIN_API_TARGET, changeOrigin: false } },
  },
  preview: {
    port: PORT,
    host: true,
    proxy: { '/admin': { target: ADMIN_API_TARGET, changeOrigin: false } },
  },
});
