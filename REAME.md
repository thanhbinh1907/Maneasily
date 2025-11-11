```markdown
# Maneasily — Hướng dẫn cấu trúc lại project (mẫu)

Mục tiêu:
- Sắp xếp source vào `src/`, assets vào `src/assets/`, tách components và services.
- Giữ các thư mục rỗng cần cho tương lai bằng `.gitkeep`.
- Cung cấp file khởi tạo để chạy thử.

Hướng dẫn nhanh:
1. Mở GitHub Desktop → chọn repo → Branch → New Branch → đặt tên `restructure/project-layout`.
2. Mở repo trên máy (Repository → Show in Explorer/Finder).
3. Tạo các thư mục và file theo cấu trúc trong README này; tạo các `.gitkeep` trong thư mục rỗng.
4. Quay lại GitHub Desktop → Commit to branch → Publish branch → Create Pull Request.
5. Kiểm tra trang local bằng cách mở `index.html` hoặc chạy server tĩnh (`npx serve .`) nếu muốn.

Ghi chú:
- Nếu đang có file HTML/CSS/JS cũ: copy vào `src/` và cập nhật đường dẫn trong `index.html`.
- Sau khi merge, bạn có thể thêm pipeline (Vite/Webpack) hoặc unit tests trong `tests/`.
```