/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sidebar-bg': '#181818',
        'main-bg': '#212121',
        'chatbar-bg': '#40414f',
        'tooltip-bg': '#2c2c2c',
        'sidebar-hover': '#303030',
        'hover-icon': '#5a5a6a',
      }
    },
  },
  plugins: [],
}