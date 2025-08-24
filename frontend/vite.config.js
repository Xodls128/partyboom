import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' 

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // resolve.alias 설정 추가 
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})