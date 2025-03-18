import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:4000',
  //       changeOrigin: true,
  //       secure: false
  //     }
  //   }
  // },
  plugins: [react(), tailwindcss()],
})