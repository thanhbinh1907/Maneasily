Logic kiểm tra của trang Dashboard chặt chẽ hơn so với logic hiển thị nút trên Header.
Header (common.js): Chỉ kiểm tra xem có maneasily_token hay không. Nếu có -> Hiện nút "Go to Dashboard".
Dashboard (dashboard.js): Kiểm tra cả maneasily_token VÀ maneasily_user (thông tin user như tên, avatar...).
Khi bạn đăng nhập bằng Google/GitHub, server chỉ trả về token trên URL mà chưa trả về thông tin user. Do đó, localStorage thiếu mất maneasily_user, khiến Dashboard từ chối truy cập.
Bước 1: Thêm hàm lấy thông tin User ở Backend
Bước 2: Tạo Middleware xác thực và Cập nhật Router
Bước 3: Cập nhật Frontend để Fetch User Info