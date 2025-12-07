import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import handlebars from 'vite-plugin-handlebars'

// Định nghĩa __dirname trong môi trường ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  // QUAN TRỌNG: Phải là '/' để deploy lên Vercel không bị lỗi đường dẫn CSS/JS
  base: '/', 
  
  root: '.', // Thư mục gốc là thư mục chứa file config này (client)
  
  plugins: [
    handlebars({
      // Nơi chứa các file partial như header.html, footer.html, sidebar.html
      partialDirectory: resolve(__dirname, 'src/components'),
    }),
  ],
  
  build: {
    outDir: 'dist', // Thư mục đầu ra sau khi build
    emptyOutDir: true, // Xóa sạch thư mục dist cũ trước khi build mới
    rollupOptions: {
      input: {
        // 1. Trang chủ (nằm ngay ngoài root)
        main: resolve(__dirname, 'index.html'),

        // 2. Các trang Auth
        signin: resolve(__dirname, 'src/pages/signin.html'),
        signup: resolve(__dirname, 'src/pages/signup.html'),
        resetPassword: resolve(__dirname, 'src/pages/reset-password.html'),
        invite: resolve(__dirname, 'src/pages/invite.html'),

        // 3. Các trang App chính (Dashboard, Board...)
        dashboard: resolve(__dirname, 'src/pages/dashboard.html'),
        projects: resolve(__dirname, 'src/pages/projects.html'),
        board: resolve(__dirname, 'src/pages/Board.html'), // Lưu ý: File của bạn viết hoa chữ B
        activity: resolve(__dirname, 'src/pages/activity.html'),
        schedule: resolve(__dirname, 'src/pages/schedule.html'),
        settings: resolve(__dirname, 'src/pages/settings.html'),

        // 4. Các trang Landing/Marketing
        features: resolve(__dirname, 'src/pages/features.html'),
        pricing: resolve(__dirname, 'src/pages/pricing.html'),
        download: resolve(__dirname, 'src/pages/download.html'),
        howItWorks: resolve(__dirname, 'src/pages/how-it-works.html'),
        careers: resolve(__dirname, 'src/pages/careers.html'),
        contact: resolve(__dirname, 'src/pages/contact.html'),
        
        // 5. Blog & Resources & Support
        resources: resolve(__dirname, 'src/pages/resources.html'),
        community: resolve(__dirname, 'src/pages/community.html'),
        support: resolve(__dirname, 'src/pages/support.html'),
        helpCenter: resolve(__dirname, 'src/pages/help-center.html'),
        blogArticle: resolve(__dirname, 'src/pages/blog-article.html'),
        blogTips: resolve(__dirname, 'src/pages/blog-tips.html'),
        blogTeamwork: resolve(__dirname, 'src/pages/blog-teamwork.html'),
      },
    },
  },
  
  // Cấu hình server khi chạy dev (localhost)
  server: {
    port: 5173,
    open: true, // Tự động mở trình duyệt khi chạy npm run dev
  }
})