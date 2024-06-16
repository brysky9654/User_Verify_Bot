const { Bot, InlineKeyboard } = require('grammy');

// Replace 'YOUR_BOT_TOKEN' with the token you got from BotFather
const bot = new Bot('7227754259:AAFvT6Sx6KNoDiwjtXpB1zJAh2MokVidWcc');

// A map to keep track of new users and their verification status
const newUsers = new Map();

// Listen for new chat members
bot.on('chat_member', async (ctx) => {
    const chatMember = ctx.chatMember;

    console.log(`${chatMember.from.first_name} joined.`)

    if (chatMember.new_chat_member) {
        const newUser = chatMember.new_chat_member.user;
        const userName = newUser.username || newUser.first_name;
        const chatId = ctx.chat.id;
        const userId = newUser.id;

        // Restrict the new user from sending messages
        await bot.api.restrictChatMember(chatId, userId, {
            can_send_messages: false,
            can_send_media_messages: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false,
            can_change_info: false,
            can_invite_users: false,
            can_pin_messages: false,
        });

        // Add the user to the newUsers map with verification status false
        newUsers.set(userId, false);

        // Send a verification message with an inline keyboard button
        const keyboard = new InlineKeyboard().text('Verify', 'verify');
        await ctx.api.sendMessage(chatId, `Welcome to the group, ${userName}! Please verify to join the chat.`, { reply_markup: keyboard });
    }
});

// Listen for callback queries (button clicks)
bot.on('callback_query:data', async (ctx) => {
    const callbackQuery = ctx.callbackQuery;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;

    console.log("verified!!!")

    if (data === 'verify' && newUsers.has(userId) && newUsers.get(userId) === false) {
        // Mark the user as verified
        newUsers.set(userId, true);

        // Unrestrict the user, allowing them to send messages
        await bot.api.restrictChatMember(chatId, userId, {
            can_send_messages: true,
            can_send_media_messages: true,
            can_send_polls: true,
            can_send_other_messages: true,
            can_add_web_page_previews: true,
            can_change_info: false,
            can_invite_users: true,
            can_pin_messages: false,
        });

        // Notify the user and the group
        await ctx.answerCallbackQuery({ text: 'You have been verified!' });
        await ctx.api.sendMessage(chatId, `${callbackQuery.from.first_name} has been verified and can now join the chat.`);
    }
});

// Start the bot
bot.start();
