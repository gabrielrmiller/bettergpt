import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use environment variable for base path, default to '/' for Vercel
// Set VITE_BASE_PATH='/bettergpt/' for GitHub Pages deployment
const isGitHubPages = process.env.VITE_GH_PAGES === 'true'

export default defineConfig({
  base: './',
  plugins: [react()],
})