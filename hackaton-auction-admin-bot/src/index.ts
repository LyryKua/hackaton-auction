import {Context, Telegraf} from 'telegraf';
import 'dotenv/config';
import {ExampleShared, launchBot} from 'hackaton-auction-common';
import {Db, MongoClient} from "mongodb";

if (!process.env.BOT_TOKEN) {
  throw new Error('no BOT_TOKEN provided');
}
if (!process.env.DB_NAME) {
  throw new Error('no DB_NAME provided');
}
if (!process.env.DB_URL) {
  throw new Error('no DB_URL provided');
}
const { BOT_TOKEN, DB_NAME, DB_URL } = process.env

interface AppContext extends Context {
  db: Db;
}

const bot = new Telegraf<AppContext>(BOT_TOKEN);

bot.use(async (ctx, next) => {
  const connection = await MongoClient.connect(DB_URL);
  ctx.db = connection.db(DB_NAME);
  return next();
});

bot.command('test', ctx => {
  const t = new ExampleShared();

  ctx.reply(t.test());
  ctx.reply("I'm 'hackaton-auction-admin-bot'");
  ctx.reply(
    `You are @${ctx.message.from.username}. Your id – ${ctx.message.from.id}`
  );
});

launchBot(bot);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
