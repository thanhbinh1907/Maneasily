import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'      
import { fileURLToPath } from 'url'           
import handlebars from 'vite-plugin-handlebars'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  base: './',
  root: '.',
  plugins: [
    handlebars({
      partialDirectory: resolve(__dirname, 'src/components'),
    }),
  ],
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