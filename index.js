const { Bot, InlineKeyboard } = require('grammy');

// Replace 'YOUR_BOT_TOKEN' with the token you got from BotFather
const bot = new Bot('7227754259:AAFvT6Sx6KNoDiwjtXpB1zJAh2MokVidWcc');

// Handle join requests

bot.on('chat_member', async (ctx) => {
    const user = ctx.chatMember;

    console.log(user.from.first_name);

    if (user.new_chat_member.status == 'member' && user.old_chat_member.status == "left") {
        const newUser = user.new_chat_member.user;
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
        // newUser.set(userId, false);

        const keyboard = new InlineKeyboard().text("Click to Verify", "verify_join_request");

        // Send a welcome message with the button
        await ctx.reply(
            `Welcome, ${user.from.first_name}! Please click the button below to verify your join request.`,
            { reply_markup: keyboard }
        );
    }
});

// Handle callback queries
bot.callbackQuery('verify_join_request', async (ctx) => {
    console.log("verified!!!!!!!!!");

    const userId = ctx.from.id;
    const chatId = ctx.chat.id;

    // Approve the join request
    await ctx.api.approveChatJoinRequest(chatId, userId);
    await ctx.answerCallbackQuery("You have been verified and added to the group!");

    // Optionally, send a welcome message to the group
    await ctx.reply(`Welcome to the group, ${ctx.from.first_name}!`);
});

// Start the bot
// bot.start();

bot.start({
    allowed_updates: ["chat_member", "message", "message_reaction", "message_reaction_count", "channel_post", "edited_channel_post"],
});
