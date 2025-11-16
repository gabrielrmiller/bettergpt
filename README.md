# BetterGPT

A modern GPT interface built with React, Vite, and Tailwind CSS.

## 🚀 Deployment

### Vercel (Recommended)

This project is configured for Vercel deployment with API route support.

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect the configuration

2. **API Routes:**
   - API routes are in the `/api` directory
   - Example: `/api/hello.ts` is available at `https://your-domain.vercel.app/api/hello`
   - Add more API routes in the `/api` folder

3. **Environment Variables:**
   - The base path defaults to `/` for Vercel
   - No additional configuration needed

### GitHub Pages (Optional)

If you want to deploy to GitHub Pages as well:

1. **Build with GitHub Pages base path:**
   ```bash
   npm run deploy:github
   ```

2. **Commit and push:**
   ```bash
   git add index.html 404.html assets/ *.png *.svg
   git commit -m "Update GitHub Pages deployment"
   git push origin main
   ```

3. **Configure GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: `main` branch, `/ (root)`

## 🛠️ Development

```bash
# Install dependencies
cd client
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
bettergpt/
├── api/              # Vercel serverless functions
│   └── hello.ts      # Example API route
├── client/           # React frontend
│   ├── src/          # Source files
│   ├── public/       # Static assets
│   └── dist/         # Build output
├── vercel.json       # Vercel configuration
└── package.json      # Root package.json for API dependencies
```

## 🔧 Configuration

- **Base Path:** Configured in `client/vite.config.ts`
  - Default: `/` (for Vercel)
  - GitHub Pages: Set `VITE_BASE_PATH='/bettergpt/'` when building

- **API Routes:** Add serverless functions in `/api` directory
  - Each file exports a default handler function
  - Supports TypeScript out of the box

## 📝 Notes

- The main branch is configured for Vercel deployment
- GitHub Pages deployment files are in the root (for dual deployment)
- API routes only work on Vercel, not GitHub Pages

