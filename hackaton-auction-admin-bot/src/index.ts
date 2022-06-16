import {Context, Telegraf} from 'telegraf';
import 'dotenv/config';
import {ExampleShared, launchBot} from 'hackaton-auction-common';
import {Db, MongoClient} from 'mongodb';

const {BOT_TOKEN, DB_NAME, DB_URL} = process.env;

if (!process.env.BOT_TOKEN) {
  throw new Error('no BOT_TOKEN provided');
}
if (!process.env.DB_NAME) {
  throw new Error('no DB_NAME provided');
}
if (!process.env.DB_URL) {
  throw new Error('no DB_URL provided');
}

interface AppContext extends Context {
  db: Db;
}

const bot = new Telegraf<AppContext>(BOT_TOKEN);

bot.use(async (ctx, next) => {
  const connection = await MongoClient.connect(DB_URL);
  ctx.db = connection.db(DB_NAME);
  return next();
});

bot.command('create', ctx => {
  ctx.reply('Створити аукціон');
});

bot.command('edit', ctx => {
  ctx.reply('Редагувати');
});

bot.command('about', ctx => {
  ctx.reply('Тут буде інфа про те як працює бот');
});

bot.command('bids', ctx => {
  ctx.reply('Подивитись останню ставку');
});

bot.command('close', ctx => {
  ctx.reply('Закрити аукціон');
});

launchBot(bot);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
