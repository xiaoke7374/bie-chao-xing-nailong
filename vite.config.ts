import { defineConfig } from 'vite'

export default defineConfig({
  // 相对路径，兼容 GitHub Pages 子路径与本地预览
  base: './',
  server: {
    host: true,
    port: 5173,
  },
})
