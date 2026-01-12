import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Örn: huseyinnmutlu.github.io/catmap-projesi/ ise "/catmap-projesi/" yazmalısın
  base: "/catmap-accessibility-tool/", 
})