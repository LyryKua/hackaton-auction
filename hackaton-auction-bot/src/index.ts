import {Telegraf, Context} from 'telegraf';
import 'dotenv/config';
import {Db, MongoClient} from 'mongodb';
import {ExampleShared, launchBot} from 'hackaton-auction-common';

const example = new ExampleShared();
example.test();

const url = 'mongodb://localhost:27017/'; // TODO: move it to `.env`
const DB_NAME = 'auction_bot'; // TODO: move it to `.env`

if (!process.env.BOT_TOKEN) {
  throw new Error('no BOT_TOKEN provided');
}

interface AppContext extends Context {
  db: Db;
}

const bot = new Telegraf<AppContext>(process.env.BOT_TOKEN);

bot.use(async (ctx, next) => {
  const connection = await MongoClient.connect(url);
  ctx.db = connection.db(DB_NAME);
  return next();
});
bot.command('make_bit', ctx => {
  ctx.reply('Ставка прийнята');
});

bot.command('subscribe', ctx => {
  ctx.reply('Ви підписались на оновлення');
});

bot.command('subscribe', ctx => {
  ctx.reply('Ви відписались від оновлень');
});

bot.command('max_bid', ctx => {
  ctx.reply('Максимальна ставка 100500');
});

bot.command('about', ctx => {
  ctx.reply('У цьому боті ви можете робити ставку');
});

launchBot(bot);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
