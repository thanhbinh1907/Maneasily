import Users from '../models/userModel.js';
import Projects from '../models/projectModel.js';
import Invitations from '../models/invitationModel.js'; 
import Notifications from '../models/notificationModel.js';
import { sendEmail } from '../utils/emailUtils.js';
import { sendNotification } from '../utils/socketUtils.js';
import { logActivity } from '../utils/activityUtils.js';

const userCtrl = {
    // Tìm kiếm người dùng (Tối ưu: Index + Prefix Regex + Lean + Projection)
    searchUsers: async (req, res) => {
        try {
            const { q } = req.query;
            if (!q) return res.json({ users: [] }); 

            const users = await Users.find({
                $and: [
                    {
                        $or: [
                            { username: { $regex: `^${q}`, $options: 'i' } },
                            { email: { $regex: `^${q}`, $options: 'i' } }
                        ]
                    },
                    // Chỉ hiện người cho phép tìm kiếm
                    // (Điều kiện $ne: false để mặc định là true nếu chưa có field này)
                    { "settings.privacy.searchable": { $ne: false } }
                ]
            })
            .lean()
            .limit(5)
            .select("username email avatar");

            res.json({ users });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

// --- 2. THÊM THÀNH VIÊN (Cập nhật: Dùng requireInvite thay isPrivate) ---
    addMemberToProject: async (req, res) => {
        try {
            const { projectId, userId: memberIdToAdd } = req.body;
            const requesterId = req.user.id;

            const project = await Projects.findById(projectId);
            if (!project) return res.status(404).json({ err: "Dự án không tồn tại" });

            const isOwner = project.userOwner.toString() === requesterId;
            const isManager = project.admins.includes(requesterId);
            if (!isOwner && !isManager) return res.status(403).json({ err: "Bạn không có quyền." });

            const userToAdd = await Users.findById(memberIdToAdd);
            const requester = await Users.findById(requesterId);

            if (project.members.includes(memberIdToAdd)) {
                return res.status(400).json({ err: "Thành viên này đã có trong dự án." });
            }

            // [MỚI] Kiểm tra setting requireInvite thay cho isPrivate
            // Dùng toán tử ?? false để mặc định là false nếu chưa có setting
            const shouldInvite = userToAdd.settings?.privacy?.requireInvite ?? false;

            if (shouldInvite) {
                // ... (Logic gửi lời mời & email giữ nguyên) ...
                const existingInvite = await Invitations.findOne({
                    recipient: memberIdToAdd, project: projectId, status: 'pending'
                });
                if (existingInvite) return res.status(400).json({ err: "Đã gửi lời mời, đang chờ xác nhận." });

                const newInvite = new Invitations({
                    sender: requesterId, recipient: memberIdToAdd, project: projectId
                });
                await newInvite.save();

                const notif = await Notifications.create({
                    recipient: memberIdToAdd,
                    sender: requesterId,
                    content: `đã mời bạn tham gia dự án "${project.title}"`,
                    type: 'invite',
                    link: newInvite._id.toString()
                });
                await notif.populate("sender", "username avatar");
                sendNotification(req, memberIdToAdd, notif);

                // Gửi Email nếu user cho phép (mặc định cho phép)
                if (userToAdd.settings?.notifications?.emailOnInvite !== false) {
                    await sendEmail(
                        userToAdd.email,
                        `Lời mời tham gia dự án: ${project.title}`,
                        `<p>Xin chào <b>${userToAdd.username}</b>,</p>
                        <p><b>${requester.username}</b> đã mời bạn tham gia dự án <b>${project.title}</b>.</p>
                        <p>Vui lòng truy cập Maneasily để chấp nhận hoặc từ chối.</p>`
                    );
                }

                return res.json({ msg: "Đã gửi lời mời (do người dùng bật chế độ phê duyệt)." });
            } 
            
            // Nếu không bật requireInvite -> Thêm thẳng
            await Projects.findByIdAndUpdate(projectId, { $addToSet: { members: memberIdToAdd } });
            await Users.findByIdAndUpdate(memberIdToAdd, { $addToSet: { projects: projectId } });
            
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
    // --- 3. CẬP NHẬT HỒ SƠ (Cập nhật: Nhận object settings) ---
    updateProfile: async (req, res) => {
        try {
            // Nhận thêm settings từ body
            const { username, avatar, settings } = req.body;
            const userId = req.user.id;

            if (!username) return res.status(400).json({ err: "Tên người dùng không được để trống." });
            if (username.length < 6) return res.status(400).json({ err: "Tên người dùng phải có ít nhất 6 ký tự." });

            const userExists = await Users.findOne({ username: username, _id: { $ne: userId } });
            if (userExists) return res.status(400).json({ err: "Tên người dùng này đã có người sử dụng." });

            // Chuẩn bị dữ liệu update
            let updateData = { username, avatar };

            // Nếu frontend gửi settings lên thì update (dùng $set để merge)
            if (settings) {
                updateData.settings = settings;
            }

            const updatedUser = await Users.findByIdAndUpdate(userId, 
                { $set: updateData }, 
                { new: true }
            ).select("-password");

            res.json({ msg: "Cập nhật thành công!", user: updatedUser });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
    // --- XỬ LÝ PHẢN HỒI LỜI MỜI (Đồng ý / Từ chối) ---
    respondInvitation: async (req, res) => {
        try {
            const { invitationId, status } = req.body; 
            const userId = req.user.id;

            // 1. Tìm lời mời
            const invite = await Invitations.findById(invitationId);
            if (!invite) {
                await Notifications.findOneAndUpdate(
                    { link: invitationId, recipient: userId, type: 'invite' },
                    { type: 'system', content: 'Lời mời này không còn hiệu lực.' }
                );
                return res.status(404).json({ err: "Lời mời không tồn tại hoặc đã bị hủy." });
            }

            if (invite.recipient.toString() !== userId) {
                return res.status(403).json({ err: "Bạn không có quyền." });
            }

            // [QUAN TRỌNG] Lấy thông tin dự án để có tên (title)
            const project = await Projects.findById(invite.project);
            const projectName = project ? project.title : "Dự án";

            // 2. Xử lý Logic Đồng ý
            if (status === 'accepted') {
                await Projects.findByIdAndUpdate(invite.project, { $addToSet: { members: userId } });
                await Users.findByIdAndUpdate(userId, { $addToSet: { projects: invite.project } });
                
                // [SỬA LOGIC GHI LOG]
                // Thay vì ghi cứng "Thành viên mới" hay tên user, hãy dùng projectName
                await logActivity(
                    req, 
                    invite.project, 
                    "joined", 
                    projectName, // <--- Target là Tên Dự Án
                    "đã tham gia dự án", 
                    "member"
                );

                // Báo cho người mời
                const notif = await Notifications.create({
                    recipient: invite.sender,
                    sender: userId,
                    content: `đã chấp nhận tham gia dự án "${projectName}"`,
                    type: 'system',
                    link: `/src/pages/Board.html?id=${invite.project}`
                });
                await notif.populate("sender", "username avatar");
                sendNotification(req, invite.sender, notif);
            }

            // --- 2.b. Xử lý Logic Từ chối ---
            else if (status === 'rejected') {
                const notif = await Notifications.create({
                    recipient: invite.sender,
                    sender: userId,
                    content: `đã từ chối lời mời tham gia dự án "${projectName}"`,
                    type: 'system',
                    link: '#' 
                });
                await notif.populate("sender", "username avatar");
                sendNotification(req, invite.sender, notif);
            }

            // 3. Cập nhật trạng thái thông báo
            await Notifications.findOneAndUpdate(
                { link: invitationId, recipient: userId, type: 'invite' },
                { 
                    type: status === 'accepted' ? 'invite_accepted' : 'invite_rejected',
                    isRead: true 
                }
            );

            // 4. Xóa lời mời
            await Invitations.findByIdAndDelete(invitationId);

            res.json({ msg: status === 'accepted' ? "Đã tham gia dự án!" : "Đã từ chối lời mời." });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ err: err.message });
        }
    },
    updateSettings: async (req, res) => {
        try {
            const { theme, notifications, privacy } = req.body;
            // Sử dụng toán tử $set để chỉ cập nhật các trường gửi lên
            await Users.findByIdAndUpdate(req.user.id, {
                $set: {
                    "settings.theme": theme,
                    "settings.notifications": notifications,
                    "settings.privacy": privacy
                }
            });
            res.json({ msg: "Đã lưu cài đặt" });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    }
};

export default userCtrl;