import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync } from 'fs'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

function firebaseSwConfigPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'firebase-sw-config',
    buildStart() {
      const config = {
        apiKey: env.VITE_FIREBASE_API_KEY ?? '',
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
        projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
        appId: env.VITE_FIREBASE_APP_ID ?? '',
      }
      writeFileSync(
        path.resolve(rootDir, 'public/__firebase_config.js'),
        `self.__FIREBASE_CONFIG__=${JSON.stringify(config)}`,
      )
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')

  return {
    plugins: [
      firebaseSwConfigPlugin(env),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        devOptions: {
          enabled: false,
        },
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'Nudge',
          short_name: 'Nudge',
          description: 'Personal follow-up and task management',
          theme_color: '#0B0D10',
          background_color: '#0B0D10',
          display: 'standalone',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
      dedupe: ['react', 'react-dom', 'firebase/app', 'firebase/firestore', 'firebase/auth'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'dexie'],
    },
  }
})
