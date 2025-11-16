import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use environment variable for base path, default to '/' for Vercel
// Set VITE_BASE_PATH='/bettergpt/' for GitHub Pages deployment
const basePath = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base: basePath,
  plugins: [react()],
})