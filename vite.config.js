import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⚡  Yayınlama sırasında dosyaların nerede aranacağını bildirir.
  base: "/catmap_deneme.ltd.sti.as_00101/", 
  // base: "/catmap_deneme.ltd.sti.as_00101/", 
})