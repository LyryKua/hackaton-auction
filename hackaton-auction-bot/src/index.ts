import {Telegraf} from 'telegraf';
import 'dotenv/config';
import {ExampleShared} from 'hackaton-auction-common';

const example = new ExampleShared();
example.test();

if (!process.env.BOT_TOKEN) {
  throw new Error('no BOT_TOKEN provided');
}

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('test', ctx => {
  ctx.reply('Hello!');
  ctx.reply("I'm 'hackaton-auction-bot'");
  ctx.reply(
    `You are @${ctx.message.from.username}. Your id – ${ctx.message.from.id}`
  );
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
