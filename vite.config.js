import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFile } from 'node:fs/promises'

const surgeSpaFallback = {
  name: 'surge-spa-fallback',
  apply: 'build',
  async closeBundle() {
    await copyFile(new URL('./dist/index.html', import.meta.url), new URL('./dist/200.html', import.meta.url))
  },
}

export default defineConfig({
  base: '/',
  plugins: [react(), surgeSpaFallback],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
})
