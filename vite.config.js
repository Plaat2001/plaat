import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      // exceljs (export de Seguimiento a Excel) se carga con import() dinámico para no
      // penalizar la carga inicial de la PWA — pero por defecto Workbox precachea TODOS los
      // chunks generados por patrón de fichero, sin mirar si de verdad se llegan a pedir desde
      // el punto de entrada, así que sin esto se descargaría igual en la instalación. Se excluye
      // explícitamente para que solo se descargue la primera vez que se pulse "Exportar Excel".
      workbox: { globIgnores: ['**/exceljs.min-*.js'] },
      manifest: {
        name: 'PLAAT — Seguimiento de obras',
        short_name: 'PLAAT',
        description: 'Seguimiento de obras DEO',
        theme_color: '#1C1C1A',
        background_color: '#F2F1ED',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
