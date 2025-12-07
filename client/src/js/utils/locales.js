// client/src/js/utils/locales.js

export const resources = {
    vi: {
        // --- Sidebar ---
        "sidebar.overview": "Tổng quan",
        "sidebar.activity": "Hoạt động",
        "sidebar.projects": "Dự án",
        "sidebar.schedule": "Lịch trình",
        "sidebar.settings": "Cài đặt",

        // --- Header / Nav ---
        "nav.search_placeholder": "Tìm kiếm...",
        "nav.profile": "Hồ sơ cá nhân",
        "nav.logout": "Đăng xuất",
        "nav.notifications": "Thông báo",
        "nav.mark_read": "Đánh dấu đã đọc",
        "nav.no_notif": "Không có thông báo mới.",

        // --- Dashboard ---
        "dash.welcome": "Xin chào,",
        "dash.project_joined": "Dự án tham gia",
        "dash.task_today": "Việc cần làm hôm nay",
        "dash.task_overdue": "Công việc quá hạn",
        "dash.recent_projects": "Dự án truy cập gần đây",
        "dash.view_all": "Xem tất cả",
        "dash.recent_activity": "Hoạt động mới nhất",
        "dash.view_more": "Xem thêm",
        "dash.loading": "Đang tải...",
        "dash.no_project": "Chưa có dự án nào.",
        "dash.no_activity": "Chưa có hoạt động nào.",

        // --- Activity Page ---
        "activity.title": "Hoạt động dự án",
        "activity.pinned": "Đã ghim",
        "activity.all_projects": "Tất cả dự án",

        // --- Projects Page ---
        "projects.my_projects": "Dự án của tôi",
        "projects.create_new": "Tạo mới",

        // --- Schedule Page ---
        "schedule.title": "Lịch trình & Tiến độ",
        "schedule.filter_month": "Tháng này",
        "schedule.filter_all": "Toàn bộ",
        "schedule.export_google": "Xuất Google Calendar",
        "schedule.export_week": "Trong Tuần này",
        "schedule.export_month": "Trong Tháng này",
        "schedule.export_all": "Tất cả công việc",
        "schedule.stat_total": "Tổng công việc",
        "schedule.stat_active": "Đang thực hiện",
        "schedule.stat_overdue": "Đã quá hạn",
        "schedule.chart_timeline": "Dòng thời gian (Timeline)",
        "schedule.chart_status": "Trạng thái",
        "schedule.chart_project": "Việc theo Dự án",
        // Các nhãn biểu đồ (Chart.js)
        "schedule.stat_not_started": "Chưa bắt đầu",
        "schedule.stat_done": "Đã xong",

        // --- Settings Page ---
        "settings.title": "Cài đặt",
        "settings.tab_account": "Tài khoản",
        "settings.tab_general": "Chung & Giao diện",
        "settings.tab_notif": "Thông báo",
        "settings.tab_privacy": "Riêng tư",
        "settings.save_btn": "Lưu thay đổi",
        "settings.saving": "Đang lưu...",

        // Settings - Account
        "settings.header_personal": "Thông tin cá nhân",
        "settings.lbl_avatar": "Avatar (URL)",
        "settings.lbl_displayname": "Tên hiển thị",
        "settings.lbl_email": "Email",
        "settings.danger_zone": "Vùng nguy hiểm",
        "settings.change_password": "Đổi mật khẩu",
        "settings.change_pass_desc": "Bạn sẽ nhận được email để đặt lại mật khẩu.",
        "settings.send_req": "Gửi yêu cầu",

        // Settings - General
        "settings.header_appearance": "Giao diện",
        "settings.lbl_theme": "Chế độ hiển thị",
        "settings.theme_light": "Sáng (Light)",
        "settings.theme_dark": "Tối (Dark)",
        "settings.lbl_lang": "Ngôn ngữ",

        // Settings - Notifications
        "settings.via_email": "Qua Email",
        "settings.email_desc": "Chọn những email bạn muốn nhận.",
        "settings.notif_invite": "Lời mời & Cộng tác",
        "settings.notif_invite_desc": "Khi có người mời bạn vào dự án hoặc giao việc cho bạn.",
        "settings.notif_deadline": "Nhắc nhở hạn chót",
        "settings.notif_deadline_desc": "Gửi cảnh báo khi công việc sắp hết hạn.",
        "settings.in_app": "Trong ứng dụng",
        "settings.notif_sound": "Âm thanh thông báo",
        "settings.notif_sound_desc": "Phát tiếng \"Ting\" khi có thông báo mới.",
        "settings.notif_toast": "Thông báo nổi (Toast)",
        "settings.notif_toast_desc": "Hiện hộp thoại nhỏ góc màn hình khi có cập nhật mới.",

        // Settings - Privacy
        "settings.header_privacy": "Quyền riêng tư",
        "settings.privacy_desc": "Kiểm soát cách người khác tương tác với tài khoản của bạn.",
        "settings.priv_search": "Cho phép tìm kiếm",
        "settings.priv_search_desc": "Người khác có thể tìm thấy bạn qua Email hoặc Tên người dùng.",
        "settings.priv_invite": "Yêu cầu phê duyệt tham gia",
        "settings.priv_invite_desc": "Khi được mời, bạn sẽ không bị thêm tự động mà cần phải nhấn \"Đồng ý\".",

        // --- Common / Modal ---
        "modal.cancel": "Hủy",
        "modal.confirm": "Đồng ý",
        "modal.delete": "Xóa",
        "msg.create_success": "Tạo thành công!",
        "msg.update_success": "Cập nhật thành công!",
        "msg.deleted_success": "Đã xóa thành công!",
        "msg.confirm_delete_column": "Xóa cột này và toàn bộ công việc bên trong?"
    },
    en: {
        // --- Sidebar ---
        "sidebar.overview": "Overview",
        "sidebar.activity": "Activity",
        "sidebar.projects": "Projects",
        "sidebar.schedule": "Schedule",
        "sidebar.settings": "Settings",

        // --- Header / Nav ---
        "nav.search_placeholder": "Search...",
        "nav.profile": "My Profile",
        "nav.logout": "Log out",
        "nav.notifications": "Notifications",
        "nav.mark_read": "Mark all read",
        "nav.no_notif": "No new notifications.",

        // --- Dashboard ---
        "dash.welcome": "Welcome,",
        "dash.project_joined": "Projects Joined",
        "dash.task_today": "Tasks Due Today",
        "dash.task_overdue": "Overdue Tasks",
        "dash.recent_projects": "Recent Projects",
        "dash.view_all": "View All",
        "dash.recent_activity": "Recent Activity",
        "dash.view_more": "View More",
        "dash.loading": "Loading...",
        "dash.no_project": "No projects yet.",
        "dash.no_activity": "No activities yet.",

        // --- Activity Page ---
        "activity.title": "Project Activity",
        "activity.pinned": "Pinned",
        "activity.all_projects": "All Projects",

        // --- Projects Page ---
        "projects.my_projects": "My Projects",
        "projects.create_new": "Create New",

        // --- Schedule Page ---
        "schedule.title": "Schedule & Progress",
        "schedule.filter_month": "This Month",
        "schedule.filter_all": "All Time",
        "schedule.export_google": "Export Google Calendar",
        "schedule.export_week": "This Week",
        "schedule.export_month": "This Month",
        "schedule.export_all": "All Tasks",
        "schedule.stat_total": "Total Tasks",
        "schedule.stat_active": "In Progress",
        "schedule.stat_overdue": "Overdue",
        "schedule.chart_timeline": "Timeline",
        "schedule.chart_status": "Status",
        "schedule.chart_project": "Tasks by Project",
        // Chart Labels
        "schedule.stat_not_started": "Not Started",
        "schedule.stat_done": "Done",

        // --- Settings Page ---
        "settings.title": "Settings",
        "settings.tab_account": "Account",
        "settings.tab_general": "General & Appearance",
        "settings.tab_notif": "Notifications",
        "settings.tab_privacy": "Privacy",
        "settings.save_btn": "Save Changes",
        "settings.saving": "Saving...",

        // Settings - Account
        "settings.header_personal": "Personal Information",
        "settings.lbl_avatar": "Avatar (URL)",
        "settings.lbl_displayname": "Display Name",
        "settings.lbl_email": "Email",
        "settings.danger_zone": "Danger Zone",
        "settings.change_password": "Change Password",
        "settings.change_pass_desc": "You will receive an email to reset your password.",
        "settings.send_req": "Send Request",

        // Settings - General
        "settings.header_appearance": "Appearance",
        "settings.lbl_theme": "Theme Mode",
        "settings.theme_light": "Light",
        "settings.theme_dark": "Dark",
        "settings.lbl_lang": "Language",

        // Settings - Notifications
        "settings.via_email": "Via Email",
        "settings.email_desc": "Choose which emails you'd like to receive.",
        "settings.notif_invite": "Invites & Collaboration",
        "settings.notif_invite_desc": "When someone invites you to a project or assigns you a task.",
        "settings.notif_deadline": "Deadline Reminders",
        "settings.notif_deadline_desc": "Send warnings when tasks are due soon.",
        "settings.in_app": "In-App",
        "settings.notif_sound": "Notification Sound",
        "settings.notif_sound_desc": "Play a \"Ding\" sound for new notifications.",
        "settings.notif_toast": "Pop-up (Toast)",
        "settings.notif_toast_desc": "Show a small popup at the corner for updates.",

        // Settings - Privacy
        "settings.header_privacy": "Privacy",
        "settings.privacy_desc": "Control how others interact with your account.",
        "settings.priv_search": "Allow Search",
        "settings.priv_search_desc": "Others can find you by Email or Username.",
        "settings.priv_invite": "Require Approval for Invites",
        "settings.priv_invite_desc": "When invited, you won't be added automatically but must click \"Accept\".",

        // --- Common / Modal ---
        "modal.cancel": "Cancel",
        "modal.confirm": "Confirm",
        "modal.delete": "Delete",
        "msg.create_success": "Created successfully!",
        "msg.update_success": "Updated successfully!",
        "msg.deleted_success": "Deleted successfully!",
        "msg.confirm_delete_column": "Delete this column and all its tasks?"
    }
};