import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // <-- 1. IMPORT THE PLUGIN

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    
    // --- 2. ADD THE PWA PLUGIN CONFIG ---
    VitePWA({
      registerType: 'autoUpdate', // Automatically update the service worker
      
      // This will create the manifest.json file for you
      manifest: {
        name: 'Stock Suggestion Application',
        short_name: 'StockSuggest',
        description: 'AI-powered stock suggestions for the Indian market.',
        theme_color: '#1f2937', // Your dark mode background
        background_color: '#1f2937',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
    // --- END OF PWA CONFIG ---
  ],
})