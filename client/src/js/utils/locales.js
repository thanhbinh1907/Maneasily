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
        "msg.confirm_delete_column": "Xóa cột này và toàn bộ công việc bên trong?",

        // --- Project Modal (Tạo/Xóa dự án) ---
        "project.create_title": "Tạo dự án mới",
        "project.name": "Tên dự án",
        "project.desc": "Mô tả",
        "project.cover": "Ảnh bìa (URL)",
        "project.delete_title": "Xóa dự án?",
        "project.delete_warning": "Hành động này không thể hoàn tác. Toàn bộ dữ liệu sẽ bị xóa.",
        "project.btn_create": "Tạo",
        "project.btn_delete_confirm": "Xóa vĩnh viễn",

        // --- Board (Giao diện bảng) ---
        "board.add_column": "Thêm cột",
        "board.manage_members": "Quản lý thành viên",
        "board.column_title_placeholder": "Ví dụ: Đang làm, Review...",
        "board.btn_add_column": "Thêm cột",
        "board.modal_add_column_title": "Thêm cột mới",

        // --- Task Modal (Tạo Task) ---
        "task.create_title": "Thêm nhiệm vụ mới",
        "task.title_placeholder": "Tên nhiệm vụ...",
        "task.desc_placeholder": "Mô tả chi tiết",
        "task.tag_placeholder": "Thẻ (Tag)",
        "task.color_label": "Chọn màu thẻ:",
        "task.start_date": "Bắt đầu",
        "task.deadline": "Hạn chót",
        "task.btn_add": "Thêm nhiệm vụ",

        // --- Task Detail (Chi tiết Task) ---
        "task.in_list": "Trong danh sách:",
        "task.desc_label": "Mô tả",
        "task.desc_save": "Lưu",
        "task.subtask_label": "Danh sách công việc",
        "task.subtask_placeholder": "Thêm một mục...",
        "task.subtask_add": "Thêm",
        "task.files_label": "Tài liệu đính kèm",
        "task.files_root": "Gốc",
        "task.comments_label": "Bình luận",
        "task.comment_placeholder": "Viết bình luận...",
        "task.comment_btn": "Bình luận",
        
        // Sidebar của Task Detail
        "task.sidebar_members": "Thành viên",
        "task.sidebar_add_member": "Thêm thành viên",
        "task.sidebar_choose_member": "Chọn người để thêm:",
        "task.sidebar_tags": "Nhãn (Tag)",
        "task.sidebar_tag_placeholder": "VD: Frontend",
        "task.sidebar_save_tag": "Lưu Nhãn",
        "task.sidebar_time": "Thời gian",
        "task.sidebar_start": "Bắt đầu:",
        "task.sidebar_deadline": "Hạn chót:",
        "task.sidebar_actions": "Hành động",
        "task.sidebar_delete": "Xóa công việc",

        // --- Subtask Member Modal ---
        "subtask.manage_members": "Quản lý thành viên",
        "subtask.tab_joined": "Đang tham gia",
        "subtask.tab_add": "Thêm thành viên",

        // --- Share Modal ---
        "share.title": "Thêm thành viên",
        "share.tab_invite": "Mời thành viên",
        "share.tab_link": "Sao chép liên kết",
        "share.search_label": "Tìm kiếm người dùng",
        "share.search_placeholder": "Nhập tên hoặc email...",
        "share.current_members": "Thành viên trong dự án:",
        "share.link_desc": "Bất kỳ ai có liên kết này đều có thể tham gia dự án.",
        "share.btn_copy": "Sao chép",

        // Common
        "common.cancel": "Hủy",
        "common.delete": "Xóa",

        // --- Bổ sung cho Task Logic ---
        "task.no_permission": "Bạn không có quyền thực hiện hành động này.",
        "task.confirm_delete_permanent": "Bạn có chắc chắn muốn xóa vĩnh viễn công việc này?",
        "task.deleted_success": "Đã xóa công việc.",
        "task.saved": "Đã lưu.",
        "task.saved_tags": "Đã lưu Nhãn & Màu sắc.",
        "task.error_load": "Lỗi tải thông tin công việc.",
        "task.no_members": "Chưa có thành viên.",
        "task.no_available_members": "Hết thành viên để thêm.",
        
        // Time status
        "time.starts_in": "Bắt đầu sau:",
        "time.remaining": "Còn lại:",
        "time.overdue": "Đã quá hạn!",
        "time.day": "ngày",
        "time.hour": "giờ",
        "time.minute": "phút",

        // Subtask
        "subtask.no_assignee": "Chưa có ai làm việc này.",
        "subtask.all_added": "Tất cả thành viên đã được thêm.",
        "subtask.kick": "Mời ra",
        "subtask.delete_confirm": "Xóa công việc con này?",

        // Comments
        "comment.edit": "Sửa",
        "comment.delete": "Xóa",
        "comment.save": "Lưu",
        "comment.cancel": "Hủy",
        "comment.empty": "Nội dung trống!",
        "comment.delete_confirm": "Bạn muốn xóa bình luận này?",
        "comment.updated": "Đã sửa bình luận.",
        "comment.deleted": "Đã xóa bình luận.",

        // Files
        "file.empty": "Thư mục trống",
        "file.uploading": "Đang tải lên:",
        "file.upload_success": "Tải lên thành công!",
        "file.too_large": "File quá lớn! Vui lòng chọn file dưới 10MB.",
        "file.confirm_delete_file": "Xóa tệp này?",
        "file.confirm_delete_folder": "Xóa thư mục này?",
        "file.created": "Đã tạo thư mục.",
        "file.enter_name": "Nhập tên thư mục mới:",

        // --- Bổ sung cho Task Status & Notifications ---
        "task.status_done": "Đã hoàn thành!",
        "task.msg_overdue": "Công việc đã quá hạn, không thể chỉnh sửa!",
        "task.msg_not_started": "Chưa đến thời gian bắt đầu!",
        "task.msg_update_member_success": "Đã cập nhật thành viên.",
        "task.msg_global_overdue": "Bạn có {n} công việc đã quá hạn!", // {n} là số lượng
        
        // Time
        "time.starts_in": "Bắt đầu sau:",
        "time.remaining": "Còn lại:",
        "time.overdue": "Đã quá hạn!",
        "time.day": "ngày",
        "time.hour": "giờ",
        "time.minute": "phút",

        // --- Board ---
        "board.breadcrumb_projects": "Dự án", // [MỚI]
        "board.add_column": "Thêm cột",
        "board.manage_members": "Quản lý thành viên",
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
        "msg.confirm_delete_column": "Delete this column and all its tasks?",

        // --- Project Modal ---
        "project.create_title": "Create New Project",
        "project.name": "Project Name",
        "project.desc": "Description",
        "project.cover": "Cover Image (URL)",
        "project.delete_title": "Delete Project?",
        "project.delete_warning": "This action cannot be undone. All data will be lost.",
        "project.btn_create": "Create",
        "project.btn_delete_confirm": "Delete Permanently",

        // --- Board ---
        "board.add_column": "Add Column",
        "board.manage_members": "Manage Members",
        "board.column_title_placeholder": "Ex: In Progress, Review...",
        "board.btn_add_column": "Add Column",
        "board.modal_add_column_title": "Add New Column",

        // --- Task Modal ---
        "task.create_title": "Add New Task",
        "task.title_placeholder": "Task title...",
        "task.desc_placeholder": "Detailed description",
        "task.tag_placeholder": "Tag",
        "task.color_label": "Select color:",
        "task.start_date": "Start Date",
        "task.deadline": "Deadline",
        "task.btn_add": "Add Task",

        // --- Task Detail ---
        "task.in_list": "In list:",
        "task.desc_label": "Description",
        "task.desc_save": "Save",
        "task.subtask_label": "Checklist",
        "task.subtask_placeholder": "Add an item...",
        "task.subtask_add": "Add",
        "task.files_label": "Attachments",
        "task.files_root": "Root",
        "task.comments_label": "Comments",
        "task.comment_placeholder": "Write a comment...",
        "task.comment_btn": "Comment",

        // Task Detail Sidebar
        "task.sidebar_members": "Members",
        "task.sidebar_add_member": "Add Member",
        "task.sidebar_choose_member": "Choose member:",
        "task.sidebar_tags": "Tags",
        "task.sidebar_tag_placeholder": "Ex: Frontend",
        "task.sidebar_save_tag": "Save Tag",
        "task.sidebar_time": "Timing",
        "task.sidebar_start": "Start:",
        "task.sidebar_deadline": "Due:",
        "task.sidebar_actions": "Actions",
        "task.sidebar_delete": "Delete Task",

        // --- Subtask Member Modal ---
        "subtask.manage_members": "Manage Members",
        "subtask.tab_joined": "Joined",
        "subtask.tab_add": "Add Member",

        // --- Share Modal ---
        "share.title": "Add Members",
        "share.tab_invite": "Invite",
        "share.tab_link": "Copy Link",
        "share.search_label": "Search Users",
        "share.search_placeholder": "Enter name or email...",
        "share.current_members": "Project Members:",
        "share.link_desc": "Anyone with this link can join the project.",
        "share.btn_copy": "Copy",

        // Common
        "common.cancel": "Cancel",
        "common.delete": "Delete",

        // --- Additions for Task Logic ---
        "task.no_permission": "You do not have permission to perform this action.",
        "task.confirm_delete_permanent": "Are you sure you want to permanently delete this task?",
        "task.deleted_success": "Task deleted.",
        "task.saved": "Saved.",
        "task.saved_tags": "Tags & Color saved.",
        "task.error_load": "Error loading task.",
        "task.no_members": "No members yet.",
        "task.no_available_members": "No members available to add.",

        // Time status
        "time.starts_in": "Starts in:",
        "time.remaining": "Remaining:",
        "time.overdue": "Overdue!",
        "time.day": "days",
        "time.hour": "hours",
        "time.minute": "mins",

        // Subtask
        "subtask.no_assignee": "No one assigned yet.",
        "subtask.all_added": "All members added.",
        "subtask.kick": "Kick",
        "subtask.delete_confirm": "Delete this subtask?",

        // Comments
        "comment.edit": "Edit",
        "comment.delete": "Delete",
        "comment.save": "Save",
        "comment.cancel": "Cancel",
        "comment.empty": "Content is empty!",
        "comment.delete_confirm": "Delete this comment?",
        "comment.updated": "Comment updated.",
        "comment.deleted": "Comment deleted.",

        // Files
        "file.empty": "Empty folder",
        "file.uploading": "Uploading:",
        "file.upload_success": "Upload successful!",
        "file.too_large": "File too large! Please choose file under 10MB.",
        "file.confirm_delete_file": "Delete this file?",
        "file.confirm_delete_folder": "Delete this folder?",
        "file.created": "Folder created.",
        "file.enter_name": "Enter folder name:",

        // --- Additions for Task Status & Notifications ---
        "task.status_done": "Completed!",
        "task.msg_overdue": "Task is overdue, cannot edit!",
        "task.msg_not_started": "Task has not started yet!",
        "task.msg_update_member_success": "Member updated successfully.",
        "task.msg_global_overdue": "You have {n} overdue tasks!",

        // Time
        "time.starts_in": "Starts in:",
        "time.remaining": "Remaining:",
        "time.overdue": "Overdue!",
        "time.day": "days",
        "time.hour": "hours",
        "time.minute": "mins",

        // --- Board ---
        "board.breadcrumb_projects": "Projects", // [NEW]
        "board.add_column": "Add Column",
        "board.manage_members": "Manage Members",
    }
};