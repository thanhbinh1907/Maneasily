import Users from "../models/userModel.js";
import Projects from "../models/projectModel.js";
import Notifications from "../models/notificationModel.js";
import Invitations from "../models/invitationModel.js"; 
import { sendNotification } from "../utils/socketUtils.js";
import { sendEmail } from "../utils/emailUtils.js";
import { logActivity } from "../utils/activityUtils.js";

const userCtrl = {
    // API Tìm kiếm người dùng (Tối ưu: Index + Prefix Regex + Lean + Projection)
    searchUsers: async (req, res) => {
        try {
            const { q } = req.query; 
            if (!q) return res.json({ users: [] });

            // Regex: `^${q}` nghĩa là "Bắt đầu bằng từ khóa q"
            // Ví dụ: q="dev" -> Tìm "developer", KHÔNG tìm "webdev"
            // $options: 'i' -> Không phân biệt hoa thường
            const users = await Users.find({
                $or: [
                    { username: { $regex: `^${q}`, $options: 'i' } },
                    { email: { $regex: `^${q}`, $options: 'i' } }
                ]
            })
            .lean() // QUAN TRỌNG: Bỏ qua bước tạo Mongoose Document, trả về JSON thuần (nhanh gấp 2-3 lần)
            .limit(5) // Chỉ lấy 5 kết quả đầu tiên
            .select("username email avatar"); // Chỉ lấy 3 trường cần thiết

            res.json({ users });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    // API Thêm thành viên (Giữ nguyên logic cũ)
    addMemberToProject: async (req, res) => {
        try {
            const { projectId, userId: memberIdToAdd } = req.body;
            const requesterId = req.user.id;

            const project = await Projects.findById(projectId);
            if (!project) return res.status(404).json({ err: "Dự án không tồn tại" });

            // Check quyền (giữ nguyên logic cũ)
            const isOwner = project.userOwner.toString() === requesterId;
            const isManager = project.admins.includes(requesterId);
            if (!isOwner && !isManager) return res.status(403).json({ err: "Bạn không có quyền." });

            // Lấy thông tin người được mời
            const userToAdd = await Users.findById(memberIdToAdd);
            const requester = await Users.findById(requesterId);

            // Kiểm tra đã có trong dự án chưa
            if (project.members.includes(memberIdToAdd)) {
                return res.status(400).json({ err: "Thành viên này đã có trong dự án." });
            }

            // === LOGIC MỚI: KIỂM TRA PRIVATE MODE ===
            if (userToAdd.isPrivate) {
                // 1. Kiểm tra xem đã có lời mời pending chưa
                const existingInvite = await Invitations.findOne({
                    recipient: memberIdToAdd, project: projectId, status: 'pending'
                });
                if (existingInvite) return res.status(400).json({ err: "Đã gửi lời mời, đang chờ xác nhận." });

                // 2. Tạo lời mời mới
                const newInvite = new Invitations({
                    sender: requesterId, recipient: memberIdToAdd, project: projectId
                });
                await newInvite.save();

                // 3. Gửi Thông báo (Loại 'invite' để frontend hiển thị nút)
                const notif = await Notifications.create({
                    recipient: memberIdToAdd,
                    sender: requesterId,
                    content: `đã mời bạn tham gia dự án "${project.title}"`,
                    type: 'invite', // Loại mới
                    link: newInvite._id.toString() // Lưu ID lời mời vào link để tiện xử lý
                });
                await notif.populate("sender", "username avatar");
                sendNotification(req, memberIdToAdd, notif);

                // 4. Gửi Email
                await sendEmail(
                    userToAdd.email,
                    `Lời mời tham gia dự án: ${project.title}`,
                    `<p>Xin chào <b>${userToAdd.username}</b>,</p>
                     <p><b>${requester.username}</b> đã mời bạn tham gia dự án <b>${project.title}</b>.</p>
                     <p>Vui lòng truy cập Maneasily để chấp nhận hoặc từ chối.</p>`
                );

                return res.json({ msg: "Vì người dùng bật chế độ Riêng tư, một lời mời đã được gửi đi!" });
            } 
            
            // === LOGIC CŨ: THÊM TRỰC TIẾP (Nếu không bật Private) ===
            await Projects.findByIdAndUpdate(projectId, { $addToSet: { members: memberIdToAdd } });
            await Users.findByIdAndUpdate(memberIdToAdd, { $addToSet: { projects: projectId } });
            
            // Thông báo như cũ
            const notif = await Notifications.create({
                recipient: memberIdToAdd, sender: requesterId,
                content: `Bạn đã được thêm vào dự án "${project.title}"`,
                type: 'project', link: `/src/pages/Board.html?id=${projectId}`
            });
            await notif.populate("sender", "username avatar");
            sendNotification(req, memberIdToAdd, notif);
            
            await logActivity(req, projectId, "joined project", userToAdd.username, "đã tham gia dự án", "member");
            res.json({ msg: "Đã thêm thành viên thành công!" });

        } catch (err) { return res.status(500).json({ err: err.message }); }
    },
    // Hàm Toggle Ghim Dự án 
    togglePinProject: async (req, res) => {
        try {
            const { projectId } = req.body;
            const userId = req.user.id;

            const user = await Users.findById(userId);
            if (!user) return res.status(404).json({ err: "User không tồn tại" });

            // Kiểm tra trong projectSettings
            const pinnedList = user.projectSettings?.pinnedProjects || [];
            const isPinned = pinnedList.some(id => id.toString() === projectId);

            let newUser;

            if (isPinned) {
                // Bỏ ghim khỏi projectSettings
                newUser = await Users.findByIdAndUpdate(userId, {
                    $pull: { "projectSettings.pinnedProjects": projectId }
                }, { new: true });
            } else {
                // Thêm ghim vào projectSettings
                newUser = await Users.findByIdAndUpdate(userId, {
                    $addToSet: { "projectSettings.pinnedProjects": projectId }
                }, { new: true });
            }

            res.json({ 
                msg: isPinned ? "Đã bỏ ghim dự án" : "Đã ghim dự án lên đầu", 
                // Trả về danh sách pinned mới của projectSettings
                pinnedProjects: newUser.projectSettings.pinnedProjects,
                isPinned: !isPinned
            });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
    // --- CẬP NHẬT HỒ SƠ ---
    updateProfile: async (req, res) => {
        try {
            // 👇 [SỬA] Nhận thêm isPrivate từ request body
            const { username, avatar, isPrivate } = req.body;
            const userId = req.user.id;

            // 1. Validate cơ bản
            if (!username) return res.status(400).json({ err: "Tên người dùng không được để trống." });
            if (username.length < 6) return res.status(400).json({ err: "Tên người dùng phải có ít nhất 6 ký tự." });

            // 2. Kiểm tra trùng user (giữ nguyên)
            const userExists = await Users.findOne({ 
                username: username, 
                _id: { $ne: userId } 
            });

            if (userExists) {
                return res.status(400).json({ err: "Tên người dùng này đã có người sử dụng." });
            }

            // 3. Cập nhật (Thêm isPrivate vào)
            const updatedUser = await Users.findByIdAndUpdate(userId, {
                username,
                avatar,
                isPrivate // ✅ Lưu trạng thái vào DB
            }, { new: true }).select("-password");

            res.json({ msg: "Cập nhật thành công!", user: updatedUser });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
    // --- HÀM MỚI: XỬ LÝ CHẤP NHẬN / TỪ CHỐI ---
    respondInvitation: async (req, res) => {
        try {
            const { inviteId, action } = req.body; 
            const userId = req.user.id;

            const invite = await Invitations.findById(inviteId);
            if (!invite) return res.status(404).json({ err: "Lời mời không tồn tại." });
            if (invite.recipient.toString() !== userId) return res.status(403).json({ err: "Không có quyền." });

            // Hàm phụ: Cập nhật thông báo cũ để mất nút bấm
            const updateOriginalNotification = async (statusText) => {
                await Notifications.findOneAndUpdate(
                    { 
                        recipient: userId, 
                        type: 'invite', 
                        link: inviteId 
                    },
                    {
                        type: 'system', // Đổi về system
                        content: `đã mời bạn tham gia dự án (Bạn đã ${statusText})`,
                        isRead: true
                    }
                );
            };

            if (action === 'accept') {
                // 1. Thêm vào dự án
                await Projects.findByIdAndUpdate(invite.project, { $addToSet: { members: userId } });
                await Users.findByIdAndUpdate(userId, { $addToSet: { projects: invite.project } });
                
                // 2. Cập nhật trạng thái lời mời
                invite.status = 'accepted';
                await invite.save();

                // 3. Cập nhật thông báo cũ (ẩn nút)
                await updateOriginalNotification("chấp nhận");

                // 4. Tạo thông báo mới cho người mời (SỬA LẠI ĐOẠN NÀY ĐẦY ĐỦ)
                const notif = await Notifications.create({
                    recipient: invite.sender, 
                    sender: userId,
                    content: `đã chấp nhận lời mời vào dự án.`,
                    type: 'system',
                    link: `/src/pages/Board.html?id=${invite.project}` // Link đến dự án
                });
                
                // Gửi Socket cho người mời
                await notif.populate("sender", "username avatar");
                sendNotification(req, invite.sender, notif);
                
                // 5. Ghi Log hoạt động
                await logActivity(req, invite.project, "joined project", "Thành viên mới", "đã chấp nhận lời mời tham gia", "member");

                return res.json({ msg: "Đã tham gia dự án!", projectId: invite.project });
            } 
            
            if (action === 'decline') {
                invite.status = 'declined';
                await invite.save();

                // Cập nhật thông báo cũ (ẩn nút)
                await updateOriginalNotification("từ chối");

                return res.json({ msg: "Đã từ chối lời mời." });
            }

        } catch (err) { return res.status(500).json({ err: err.message }); }
    }
};

export default userCtrl;