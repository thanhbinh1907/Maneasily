import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.', // gốc dự án
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        signup: resolve(__dirname, 'src/pages/signup.html'),
        download: resolve(__dirname, 'src/pages/download.html'),
        signin: resolve(__dirname, 'src/pages/signin.html'),
        features: resolve(__dirname, 'src/pages/features.html'),
        help: resolve(__dirname, 'src/pages/help-center.html'),
        resources: resolve(__dirname, 'src/pages/resources.html'),
        board: resolve(__dirname, 'src/pages/Board.html'),
        blog1: resolve(__dirname, 'src/pages/blog-article.html'),
        blog2: resolve(__dirname, 'src/pages/blog-tips.html'),
        blog3: resolve(__dirname, 'src/pages/blog-teamwork.html'),
      },
    },
  },
})
