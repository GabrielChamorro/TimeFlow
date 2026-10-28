import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Evita EBUSY en Windows cuando .bat/.cmd auxiliares estan abiertos.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: ['**/*.bat', '**/*.cmd', '**/*.ps1'],
    },
  },
})
