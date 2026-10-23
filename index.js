const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 🌐 WEB SERVER GIỮ BOT ONLINE 24/7
app.get('/', (req, res) => {
    res.send('🤖 Bot Cà Phê Bò đang chạy 24/7 ngon lành!');
});

app.listen(PORT, () => {
    console.log(`🌐 Web Server đã khởi động tại Port: ${PORT}`);
});

const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType, 
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    REST,
    Routes,
    SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ===============================================================
// ⚙️ CẤU HÌNH HỆ THỐNG & ID MỚI - CÀ PHÊ BÒ
// ===============================================================
const TOKEN = process.env.TOKEN || 'YOUR_BOT_TOKEN_HERE'; 
const CLIENT_ID = 'YOUR_BOT_CLIENT_ID';                      
const PREFIX = '!'; 

const ADMIN_ID = '1273924198674464838';                   // ID Admin chính
const OWNER_ID = '1536664329599062026';                   // 👑 ID Trùm Server / Khách Hàng (Bạch)
const ROLE_LE_TAN_ID = '1432767437438320660';              // 📌 ID Role Lễ Tân MỚI
const TICKET_CHANNEL_ID = '1533706007044423691';           // 📌 ID Kênh Mở Ticket MỚI
const FEEDBACK_CHANNEL_ID = '1563094433820446730';         // 📌 ID Kênh Feedback MỚI

// 📌 4 Role Ping khi tạo Ticket MỚI
const TICKET_ROLES = [
    '1419138599986794727',
    '1532626382314537090',
    '1563080650037403698',
    '1532625938905436260'
];

// ---- HỆ THỐNG LƯU TRỮ DỮ LIỆU KPI ----
const POINTS_FILE = path.join(__dirname, 'letan_points.json');
const leTanPoints = new Map();
const welcomedUsers = new Set();
const ticketCreators = new Map();
const ticketClaimers = new Map();
const feedbackSelections = new Map();

let ticketCounter = 1;
let antiNukeActive = false;

function loadData() {
    try {
        if (fs.existsSync(POINTS_FILE)) {
            const data = fs.readFileSync(POINTS_FILE, 'utf8');
            const parsed = JSON.parse(data);
            for (const [k, v] of Object.entries(parsed)) leTanPoints.set(k, v);
        }
        console.log('✅ Đã nạp thành công dữ liệu KPI Lễ Tân!');
    } catch (err) {
        console.error('❌ Lỗi nạp dữ liệu:', err);
    }
}

function saveData() {
    try {
        fs.writeFileSync(POINTS_FILE, JSON.stringify(Object.fromEntries(leTanPoints), null, 2), 'utf8');
    } catch (err) {
        console.error('❌ Lỗi lưu dữ liệu KPI:', err);
    }
}

loadData();

// ===============================================================
// 🚀 ĐĂNG KÝ SLASH COMMAND (/doiten)
// ===============================================================
const commands = [
    new SlashCommandBuilder()
        .setName('doiten')
        .setDescription('Mở Menu mua Thẻ đổi tên đăng nhập hoặc Role Custom tự chọn')
].map(cmd => cmd.toJSON());

client.once('ready', async () => {
    console.log(`=================================`);
    console.log(`🤖 Bot [${client.user.tag}] đã sẵn sàng 100%!`);
    console.log(`🛡️ Hệ thống Anti-Nuker Advanced & KhachHangCuaRimKhanh đã tích hợp!`);
    console.log(`=================================`);

    try {
        if (CLIENT_ID && !CLIENT_ID.includes('YOUR_BOT')) {
            const rest = new REST({ version: '10' }).setToken(TOKEN);
            await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
            console.log('✅ Đã đăng ký thành công lệnh Slash /doiten!');
        }
    } catch (e) {
        console.error('❌ Lỗi đăng ký Slash Command:', e);
    }
});

client.on('guildMemberAdd', (member) => { welcomedUsers.delete(member.id); });

// ===============================================================
// 🎯 INTERACTION: SLASH COMMAND, BUTTONS, MODAL
// ===============================================================
client.on('interactionCreate', async (interaction) => {
    
    // ---- A. LỆNH SLASH /DOITEN ----
    if (interaction.isChatInputCommand() && interaction.commandName === 'doiten') {
        const menuEmbed = new EmbedBuilder()
            .setColor('#6f4e37')
            .setTitle('☕ SHOP ĐỔI TÊN & ROLE CUSTOM - CÀ PHÊ BÒ')
            .addFields(
                { name: '🏷️ 1. Thẻ Đổi Tên Tự Chọn', value: '• **Giá:** `12.000 VNĐ` hoặc `1.000.000 Cowoncy`\n• Đổi lại biệt danh hoặc tên hiển thị!', inline: false },
                { name: '🎨 2. Role Custom Tự Chọn', value: '• Tên 4-8 ký tự + Icon Server + Mã màu tự chọn.\n• Mở Ticket để chốt màu và Icon với Admin!', inline: false }
            );

        const buyRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('buy_rename_card').setLabel('Mua Thẻ Đổi Tên (12k/1m Cowoncy)').setStyle(ButtonStyle.Primary).setEmoji('🏷️'),
            new ButtonBuilder().setCustomId('buy_custom_role').setLabel('Mua Role Custom').setStyle(ButtonStyle.Success).setEmoji('🎨')
        );

        return await interaction.reply({ embeds: [menuEmbed], components: [buyRow], ephemeral: true });
    }

    // ---- B. XỬ LÝ NÚT BẤM (BUTTONS) ----
    if (interaction.isButton()) {
        if (interaction.customId === 'buy_rename_card') {
            return interaction.reply({ content: '🏷️ Gõ `!muahang` để chuyển khoản 12k VNĐ hoặc gõ `!admin` để đổi 1m Cowoncy với Admin!', ephemeral: true });
        }
        if (interaction.customId === 'buy_custom_role') {
            return interaction.reply({ content: '🎨 Vui lòng mở Ticket để chọn Icon và Mã Màu Custom với Admin!', ephemeral: true });
        }

        // 📩 MỞ TICKET GIAO DỊCH
        if (interaction.customId === 'open_ticket_btn') {
            await interaction.deferReply({ ephemeral: true });
            try {
                const num = String(ticketCounter).padStart(3, '0');
                ticketCounter++;
                const channelName = `ticket-${num}`;

                const permissionOverwrites = [
                    { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] }
                ];

                TICKET_ROLES.forEach(rId => {
                    permissionOverwrites.push({ id: rId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] });
                });

                const ticketChannel = await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: interaction.channel.parentId,
                    permissionOverwrites: permissionOverwrites
                });

                ticketCreators.set(ticketChannel.id, interaction.user.id);

                const pings = TICKET_ROLES.map(rId => `<@&${rId}>`).join(' ');
                const formEmbed = new EmbedBuilder()
                    .setColor('#6f4e37')
                    .setTitle('☕ PHÒNG GIAO DỊCH & HỖ TRỢ - CÀ PHÊ BÒ')
                    .setDescription(`Chào mừng ${interaction.user} đến với **Cà Phê Bò**! Vui lòng điền thông tin bên dưới:`)
                    .addFields(
                        { name: '📦 Dịch Vụ Chọn Mua:', value: '`🎨 Mua Role Custom / 🏷️ Mua Thẻ Đổi Tên / ☕ Dịch Vụ Khác...`', inline: false },
                        { name: '💳 Phương Thức TT:', value: '`MB Bank / Cowoncy / Ví Điện Tử / Thẻ Cào...`', inline: false },
                        { name: '🏦 Thông Tin CK:', value: '• **MB Bank:** `1608200899` (Chủ TK: D.D.Khanh)\n• Nội dung: `MuaHang - ' + interaction.user.username + '`', inline: false }
                    );

                const controlRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('claim_ticket').setLabel('🙋 Tiếp Nhận Ticket').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('close_ticket_trigger').setLabel('⛔ Đóng Ticket').setStyle(ButtonStyle.Danger)
                );

                await ticketChannel.send({ content: `🔔 ${interaction.user} ${pings}`, embeds: [formEmbed], components: [controlRow] });
                await interaction.editReply({ content: `✅ Đã khởi tạo phòng riêng: ${ticketChannel}` });
            } catch (err) {
                await interaction.editReply({ content: '❌ Lỗi khi khởi tạo Ticket!' });
            }
        }

        // 🙋 STAFF NHẬN SUPPORT
        if (interaction.customId === 'claim_ticket') {
            if (ticketClaimers.has(interaction.channel.id)) {
                return interaction.reply({ content: `⚠️ Ticket này đã được <@${ticketClaimers.get(interaction.channel.id)}> nhận hỗ trợ rồi!`, ephemeral: true });
            }
            ticketClaimers.set(interaction.channel.id, interaction.user.id);
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#f1c40f').setDescription(`🙋 Staff ${interaction.user} đã tiếp nhận hỗ trợ phòng này!`)] });
        }

        // ⛔ MỞ MODAL ĐÓNG TICKET
        if (interaction.customId === 'close_ticket_trigger') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return interaction.reply({ content: '❌ Chỉ Quản Trị Viên mới được đóng Ticket!', ephemeral: true });
            }
            const modal = new ModalBuilder().setCustomId('close_reason_modal').setTitle('Đóng phòng Ticket');
            const input = new TextInputBuilder().setCustomId('close_reason_input').setLabel('Nhập lý do đóng phòng:').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            return await interaction.showModal(modal);
        }

        // 📊 CHECK KPI LỄ TÂN
        if (interaction.customId === 'view_kpi_score') {
            if (!interaction.member.roles.cache.has(ROLE_LE_TAN_ID)) {
                return interaction.reply({ content: '❌ Bạn không phải Lễ Tân!', ephemeral: true });
            }
            const points = leTanPoints.get(interaction.user.id) || 0;
            const embed = new EmbedBuilder()
                .setColor('#2980b9')
                .setTitle('📊 BẢNG KPI LỄ TÂN - CÀ PHÊ BÒ')
                .addFields(
                    { name: '✨ Điểm Hiện Tại', value: `🏅 Bạn đang có: **${points} điểm**` },
                    { name: '🎁 Mốc Thưởng', value: '➔ **100đ:** <@&1547875111015682109>\n➔ **500đ:** <@&1547885381356101642>\n➔ **800đ:** <@&1547875245807902771>' }
                );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ✍️ NÚT MỞ MODAL FEEDBACK
        if (interaction.customId === 'open_feedback_modal') {
            const userSel = feedbackSelections.get(interaction.user.id) || {};
            if (!userSel.service || !userSel.stars) {
                return interaction.reply({ content: '⚠️ Vui lòng chọn **Dịch vụ** và **Số sao** ở menu trên trước!', ephemeral: true });
            }
            const modal = new ModalBuilder().setCustomId('submit_feedback_modal').setTitle('Đánh Giá Dịch Vụ Cà Phê Bò');
            const comment = new TextInputBuilder().setCustomId('feedback_comment_input').setLabel('Nhận xét cảm nhận của bạn:').setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(comment));
            return await interaction.showModal(modal);
        }
    }

    // ---- C. SELECT MENU FEEDBACK ----
    if (interaction.isStringSelectMenu()) {
        const uId = interaction.user.id;
        const currentData = feedbackSelections.get(uId) || { service: null, stars: null };

        if (interaction.customId === 'select_feedback_service') {
            currentData.service = interaction.values[0];
            feedbackSelections.set(uId, currentData);
            await interaction.reply({ content: `✅ Đã chọn Dịch Vụ: **${currentData.service}**`, ephemeral: true });
        }
        if (interaction.customId === 'select_feedback_stars') {
            currentData.stars = interaction.values[0];
            feedbackSelections.set(uId, currentData);
            await interaction.reply({ content: `✅ Đã chọn Đánh Giá: **${currentData.stars}**`, ephemeral: true });
        }
    }

    // ---- D. MODAL SUBMIT ----
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'close_reason_modal') {
            await interaction.deferReply();
            const reason = interaction.fields.getTextInputValue('close_reason_input');
            const creatorId = ticketCreators.get(interaction.channel.id);

            if (creatorId) {
                try {
                    const targetUser = await client.users.fetch(creatorId);
                    if (targetUser) {
                        await targetUser.send(`🔔 **[CÀ PHÊ BÒ]** Ticket mua hàng của bạn đã đóng.\n📝 **Lý do:** \`${reason}\`\n\n🥰 Cảm ơn bạn đã tin tưởng dịch vụ Cà Phê Bò!`);
                    }
                } catch (e) {}
            }

            await interaction.editReply(`🔒 Phòng giao dịch đã đóng: \`${reason}\`. Kênh sẽ tự xóa sau 5 giây!`);
            setTimeout(async () => {
                try {
                    ticketCreators.delete(interaction.channel.id);
                    ticketClaimers.delete(interaction.channel.id);
                    await interaction.channel.delete();
                } catch (e) {}
            }, 5000);
        }

        if (interaction.customId === 'submit_feedback_modal') {
            await interaction.deferReply({ ephemeral: true });
            const comment = interaction.fields.getTextInputValue('feedback_comment_input');
            const userSel = feedbackSelections.get(interaction.user.id) || {};

            try {
                const fbChannel = await client.channels.fetch(FEEDBACK_CHANNEL_ID);
                if (fbChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#6f4e37')
                        .setTitle('🌟 ĐÁNH GIÁ DỊCH VỤ MỚI - CÀ PHÊ BÒ')
                        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                        .addFields(
                            { name: '👤 Khách Hàng', value: `${interaction.user}`, inline: true },
                            { name: '📦 Dịch Vụ', value: `\`${userSel.service || 'Chưa chọn'}\``, inline: true },
                            { name: '⭐ Đánh Giá', value: `**${userSel.stars || '⭐5 Sao'}**`, inline: true },
                            { name: '💬 Lời Nhận Xét', value: `\`\`\`${comment}\`\`\``, inline: false }
                        )
                        .setTimestamp();

                    await fbChannel.send({ embeds: [embed] });
                    feedbackSelections.delete(interaction.user.id);
                    return await interaction.editReply('🎉 Cảm ơn bạn! Đánh giá đã được gửi lên kênh Feedback của Cà Phê Bò!');
                }
            } catch (e) {
                return await interaction.editReply('❌ Lỗi khi gửi đánh giá!');
            }
        }
    }
});

// ===============================================================
// 🤖 BỘ LỆNH VĂN BẢN (MESSAGE COMMANDS)
// ===============================================================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Auto React
    const AUTO_REACT_CHANNELS = [TICKET_CHANNEL_ID, FEEDBACK_CHANNEL_ID];
    if (AUTO_REACT_CHANNELS.includes(message.channel.id)) {
        try { await message.react('☕'); await message.react('🔥'); await message.react('✅'); } catch (e) {}
    }

    const textLower = message.content.toLowerCase().trim();

    // 👑 LỆNH +KHACHHANGCUARIMKHANH (PING OWNER)
    if (textLower === '+khachhangcuarimkhanh') {
        const embed = new EmbedBuilder()
            .setTitle('👑 KHÁCH HÀNG THÂN THIẾT CỦA RIM KHÁNH')
            .setDescription(`Chào mừng Khách Hàng VIP! Vui lòng liên hệ Trùm Server: <@${OWNER_ID}> để nhận hỗ trợ ưu tiên đặc biệt.`)
            .setColor('#FFD700')
            .setTimestamp()
            .setFooter({ text: 'Cà Phê Bò System • VIP Customer', iconURL: client.user.displayAvatarURL() });

        return message.reply({ content: `Hey <@${OWNER_ID}>! Có khách hàng thân thiết của Rim Khánh vừa gọi nè!`, embeds: [embed] });
    }

    // 🛡️ LỆNH +ANTINUKER (FAKE NGẦU BẢO VỆ SERVER)
    if (textLower === '+antinuker' || textLower === '!antinuker') {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ HỆ THỐNG BẢO VỆ ANTI-NUKER V2.5 (FAKE)')
            .setColor('#00FF00')
            .setDescription('Trạng thái hệ thống an ninh mạng của máy chủ:')
            .addFields(
                { name: '🔒 Anti-Channel Delete', value: '🟢 **ACTIVE** (Tự động khôi phục)', inline: true },
                { name: '🔒 Anti-Role Delete', value: '🟢 **ACTIVE** (Lockdown 0.1s)', inline: true },
                { name: '🔒 Anti-Mass Ban/Kick', value: '🟢 **ACTIVE** (Threshold: 3/min)', inline: true },
                { name: '🔒 Anti-Bot Add', value: '🟢 **ACTIVE** (Whitelist Only)', inline: true },
                { name: '👤 Trùm Quản Trị', value: `<@${OWNER_ID}>`, inline: false }
            )
            .setFooter({ text: 'Powered by Caphebo Anti-Nuker Core', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    // 🔴 LỆNH +NUKER / +ANTINUKER CŨ
    if (textLower === '+nuker' || textLower === '!nuker') {
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('⚠️ CẢNH BÁO BẢO VỆ SERVER - ANTI NUKE')
            .setDescription('Hệ thống Anti-Nuke Cà Phê Bò sẵn sàng chặn các hành vi phá hoại Server.')
            .addFields({ name: '🛡️ Trạng Thái Hiện Tại', value: antiNukeActive ? '🟢 **Đang BẬT**' : '🔴 **Đang TẮT**' });
        return message.reply({ embeds: [embed] });
    }

    // 🌟 LỆNH +DONE / !DONE
    if (textLower === '+done' || textLower === '!done') {
        const serviceMenu = new StringSelectMenuBuilder().setCustomId('select_feedback_service').setPlaceholder('📦 Bạn chọn dịch vụ nào?')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('1. Mua Role Custom Tự Chọn').setValue('1. Mua Role Custom').setEmoji('🎨'),
                new StringSelectMenuOptionBuilder().setLabel('2. Mua Thẻ Đổi Tên').setValue('2. Mua Thẻ Đổi Tên').setEmoji('🏷️'),
                new StringSelectMenuOptionBuilder().setLabel('3. Dịch Vụ Hosting / Server').setValue('3. Dịch Vụ Hosting').setEmoji('💻')
            );

        const starsMenu = new StringSelectMenuBuilder().setCustomId('select_feedback_stars').setPlaceholder('⭐ Đánh giá mấy sao?')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('5 Sao').setValue('⭐⭐⭐⭐⭐ (5/5)').setEmoji('🌟'),
                new StringSelectMenuOptionBuilder().setLabel('4 Sao').setValue('⭐⭐⭐⭐ (4/5)').setEmoji('⭐')
            );

        const submitBtn = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_feedback_modal').setLabel('✍️ Nhập nhận xét & Gửi').setStyle(ButtonStyle.Success)
        );

        return await message.channel.send({
            embeds: [new EmbedBuilder().setColor('#6f4e37').setTitle('🌟 ĐÁNH GIÁ DỊCH VỤ CÀ PHÊ BÒ')],
            components: [new ActionRowBuilder().addComponents(serviceMenu), new ActionRowBuilder().addComponents(starsMenu), submitBtn]
        });
    }

    // 🛡️ LỆNH +BAOHANH / !BAOHANH
    if (textLower === '+baohanh' || textLower === '!baohanh') {
        const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('🛡️ QUY ĐỊNH BẢO HÀNH - CÀ PHÊ BÒ')
            .addFields(
                { name: '🎨 Role Custom', value: 'Bảo hành đổi màu & chỉnh tên 1 lần miễn phí.' },
                { name: '🏷️ Thẻ Đổi Tên', value: 'Bảo hành cập nhật tên ngay sau khi duyệt thanh toán.' },
                { name: '💻 Hosting Bot', value: 'Bảo hành duy trì 24/7 suốt thời gian thuê.' }
            );
        return message.reply({ embeds: [embed] });
    }

    // 📊 LỆNH +CHECKDIEM
    if (textLower === '+checkdiem') {
        if (!message.member.roles.cache.has(ROLE_LE_TAN_ID)) return;
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('view_kpi_score').setLabel('Xem điểm ẩn KPI').setStyle(ButtonStyle.Success).setEmoji('📊')
        );
        return message.reply({ content: `🔔 ${message.author} Bấm vào nút dưới đây để xem điểm KPI Lễ Tân:`, components: [row] });
    }

    // 📝 LỆNH !SETUPTICKET
    if (textLower === '!setupticket') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const ticketEmbed = new EmbedBuilder()
            .setColor('#6f4e37')
            .setTitle('☕ Cà Phê Bò - Mở Ticket Hỗ Trợ Mua Role & Dịch Vụ')
            .setDescription('Bấm vào nút dưới đây để mở Ticket giao dịch mua Role Custom, Thẻ Đổi Tên hoặc nhờ hỗ trợ.')
            .setFooter({ text: 'Cà Phê Bò Support System' });

        const openBtn = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_ticket_btn').setLabel('Mở Ticket Mua Hàng').setStyle(ButtonStyle.Primary).setEmoji('📩')
        );

        await message.channel.send({ embeds: [ticketEmbed], components: [openBtn] });
        return message.delete().catch(() => {});
    }

    // 🏅 TỰ ĐỘNG CỘNG +3 ĐIỂM KPI LỄ TÂN KHI TAG THÀNH VIÊN
    if (message.member.roles.cache.has(ROLE_LE_TAN_ID) && message.mentions.members.size > 0) {
        const target = message.mentions.members.first();
        if (!welcomedUsers.has(target.id) && target.id !== message.author.id) {
            welcomedUsers.add(target.id);
            const current = (leTanPoints.get(message.author.id) || 0) + 3;
            leTanPoints.set(message.author.id, current);
            saveData();

            message.channel.send({ embeds: [new EmbedBuilder().setColor('#2ecc71').setTitle('🎉 CỘNG ĐIỂM KPI LỄ TÂN!').setDescription(`Lễ Tân ${message.author} +3đ (Tổng: **${current}đ**)`)] });
        }
    }

    // 💳 LỆNH MUA HÀNG / GIÁ / ADMIN
    if (!message.content.startsWith(PREFIX)) return;
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (cmd === 'gia' || cmd === 'menu') {
        const embed = new EmbedBuilder()
            .setColor('#6f4e37')
            .setTitle('☕ BẢNG GIÁ DỊCH VỤ CÀ PHÊ BÒ')
            .addFields(
                { name: '🎨 Role Custom Tự Chọn', value: 'Mở Ticket chọn Icon + Mã Màu' },
                { name: '🏷️ Thẻ Đổi Tên', value: '`12.000 VNĐ` hoặc `1.000.000 Cowoncy`' },
                { name: '💻 Hosting Bot Discord', value: '`12.000 VNĐ` / 7 ngày' }
            );
        return message.reply({ embeds: [embed] });
    }

    if (cmd === 'muahang') {
        const embed = new EmbedBuilder().setColor('#e74c3c').setTitle('💳 HƯỚNG DẪN THANH TOÁN - CÀ PHÊ BÒ').addFields({ name: '🏦 MB Bank', value: 'STK: **1608200899** | Chủ TK: **D.D.Khanh**' }, { name: '📝 Cú pháp', value: `\`MuaHang - CaPheBo - ${message.author.username}\`` });
        return message.reply({ embeds: [embed] });
    }

    if (cmd === 'admin') {
        return message.reply(`🔔 Khách hàng ${message.author} cần hỗ trợ mua hàng tại Cà Phê Bò! <@${ADMIN_ID}> sẽ đến ngay.`);
    }
});

// ===============================================================
// 🤖 LOGIN BOT (ĐÃ BỌC DẤU NGOẶC KÉP CHUẨN XÁC)
// ===============================================================
client.login("MTU2MzA5MTUzNTQ4NTA3NTUyOA.GjEBoq.fHnhQkRJBaz3TmVGj7_nT_eWYfv_YM6wn7K0LE");
