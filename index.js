const { Bot, InlineKeyboard } = require('grammy');

// Replace 'YOUR_BOT_TOKEN' with the token you got from BotFather
const bot = new Bot('7227754259:AAFvT6Sx6KNoDiwjtXpB1zJAh2MokVidWcc');

const pendingVerifications = new Map();


bot.on('chat_member', async (ctx) => {
    const { old_chat_member, new_chat_member, chat } = ctx.update.chat_member;

    console.log(`user: ${new_chat_member.user.username}, new member status: ${new_chat_member.status}, old member status: ${old_chat_member.status}`);

    if (old_chat_member.status === 'left' && new_chat_member.status === 'member') {
        const newUser = new_chat_member.user;
        const userName = newUser.username || newUser.first_name;
        const chatId = chat.id;
        const userId = newUser.id;

        // Restrict the new user from sending messages
        await ctx.api.restrictChatMember(chatId, userId, {
            can_send_messages: false,
            can_send_media_messages: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false,
            can_change_info: false,
            can_invite_users: false,
            can_pin_messages: false,
        });

        let remainingTime = 60;

        const keyboard = new InlineKeyboard().text("Click to Verify", "verify");
        const welcomeMessage = await ctx.api.sendMessage(chatId, 
            `Welcome, ${userName}! Please click the button below to verify you are not a bot.   You have ${remainingTime} seconds.`,
            { reply_markup: keyboard }
        );

        const interval = setInterval(async () => {
            remainingTime -= 1;
            console.log(`Remaining Time: ${remainingTime}`);

            if (remainingTime > 0) {
                try {
                    await ctx.api.editMessageText(chatId, welcomeMessage.message_id, 
                        `Welcome, ${userName}! Please click the button below to verify your join request.   You have ${remainingTime} seconds.`,
                        { reply_markup: keyboard }
                    );
                } catch (error) {
                    if (error.description.includes("not Found")) {
                        clearInterval(interval);
                        pendingVerifications.delete(userId);
                    } else {
                        console.error(`Failed to edit message: ${error.description}`);
                    }
                }
            } else {
                clearInterval(interval);
                if (pendingVerifications.has(userId)) {
                    try {
                        await ctx.api.deleteMessage(chatId, welcomeMessage.message_id);
                    } catch (error) {
                        console.error(`Failed to delete message: ${error.description}`);
                    }
                    pendingVerifications.delete(userId);
                }
            }
        }, 1000);

        pendingVerifications.set(userId, {
            chatId,
            welcomeMessageId: welcomeMessage.message_id,
            interval
        });
    }
});

// Handle callback queries
bot.on('callback_query:data', async (ctx) => {
    const callbackQuery = ctx.callbackQuery;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;

    if(pendingVerifications.has(userId)) {
        const { chatId, welcomeMessageId, interval } = pendingVerifications.get(userId);

        clearInterval(interval);

        await ctx.api.restrictChatMember(chatId, userId, {
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

        // Delete the welcome message
        try {
            await ctx.api.deleteMessage(chatId, welcomeMessageId);
        } catch (error) {
            console.error(`Failed to delete message: ${error.description}`);
        }

        // Remove the request from the pendingVerifications map
        pendingVerifications.delete(userId);
    }
    else {
        await ctx.answerCallbackQuery({text: 'There is no action to do for you. You have already verified!'});
    }
});

async function deleteMessages(chatId, messageIds) {
    for (const messageId of messageIds) {
        try {
            await bot.api.deleteMessage(chatId, messageId);
        } catch (error) {
            console.error(`Failed to delete message ${messageId} in chat ${chatId}:`, error);
        }
    }
}

bot.start({
    allowed_updates: ["chat_join_request", "chat_member", "callback_query"],
});
