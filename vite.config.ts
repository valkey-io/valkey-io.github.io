import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

// Add type declaration for import.meta.url
declare global {
  interface ImportMeta {
    url: string
  }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Map /assets to /src/assets in development
      '/assets': resolve(__dirname, 'src/assets')
    }
  },
  // Ensure static assets are handled correctly
  publicDir: 'public',
  build: {
    // Copy assets from src to public during build
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})
