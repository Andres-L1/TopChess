/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'TopChess - Aprende y Enseña Ajedrez',
        short_name: 'TopChess',
        description: 'La plataforma premium para aprender y enseñar ajedrez con videollamadas y análisis en tiempo real.',
        theme_color: '#161512',
        background_color: '#161512',
        display: 'standalone',
        scope: '/TopChess/',
        start_url: '/TopChess/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: "/TopChess/",
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
  },
} as any)
