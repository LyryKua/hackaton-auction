import {Telegraf} from 'telegraf';
import 'dotenv/config';

if (!process.env.BOT_TOKEN) {
  throw new Error('no BOT_TOKEN provided');
}

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('test', ctx => {
  ctx.reply('Hello!');
  ctx.reply(`I'm 'hackaton-auction-admin-bot'`);
  ctx.reply(
    `You are @${ctx.message.from.username}. Your id – ${ctx.message.from.id}`
  );
});

bot
  .launch()
  .catch(reason => {
    console.error('Failed to run');
    bot.stop(reason);
  })
  .then(() => {
    console.log(
      'the bot is up and running',
      bot.botInfo,
      `https://t.me/${bot.botInfo?.username}`
    );
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
