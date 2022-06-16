import {Context, Telegraf} from 'telegraf';
import 'dotenv/config';
import {
  AuctionRepository,
  launchBot,
  mockAuctions,
} from 'hackaton-auction-common';
import {Db, MongoClient} from 'mongodb';

const {BOT_TOKEN, DB_NAME, DB_URL} = process.env;

if (!BOT_TOKEN) {
  throw new Error('no BOT_TOKEN provided');
}
if (!DB_NAME) {
  throw new Error('no DB_NAME provided');
}
if (!DB_URL) {
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

const SUPER_ADMINS = [
  // devs you can add your user id here
  45412931,
];

bot.command('clear_mock', async ctx => {
  const userId = ctx.message.from.id;
  if (!SUPER_ADMINS.includes(userId)) {
    ctx.reply('Сильно хитрий?');
    return;
  }
  ctx.reply(
    'You are about to clear Auctions collection, like I mean are you mad? You sure? Y / N'
  );
  bot.on('text', async ctx => {
    const text = ctx.message.text;
    switch (text) {
      case 'N':
        ctx.reply('Good choice');
        return;
      case 'Y':
        ctx.reply('Phew, you asked for it 😬');
        // not actually doing it for now
        return;
      default:
        ctx.reply('I told you Y or N, is it not clear? 🙄');
    }
  });

  console.log('userId', userId);
});

bot.command('fill_mock', async ctx => {
  const auctionRepo = new AuctionRepository(ctx.db);
  const username = ctx.message.from.username;
  const userId = ctx.message.from.id;
  await auctionRepo.createMany(mockAuctions(username || String(userId)));
  ctx.reply('Created a couple of mock auctions for you, anything else?');
});

bot.command('list_a', async ctx => {
  const auctionRepo = new AuctionRepository(ctx.db);
  const auctions = await auctionRepo.findAll();
  ctx.reply('Here they all are right from the DB');
  ctx.reply(JSON.stringify(auctions, null, 2));
});

bot.command('about', ctx => {
  console.log('about');
  ctx.reply(`Користуватися ботом дуже легко. Дивися:
/create - Створити аукціон. Придумай назву для аукціону, додай фото, початкову ставку та опис (деталі, ціль збору коштів та все, щоб заохотити учасників).
Коли аукціон створено, ти отримаєш готове посилання на бота для учасників. Поділися ним в соціальних мережах, аби більше людей знали про твій аукціон.
/bids - Подивитися останні 3 ставки.
`);
});

bot.command('show_link', (ctx, ...args) => {
  const auctionId = ctx.message.text.split(' ')[1];
  if (!auctionId) {
    ctx.reply('please pass the id, run /show_link ID');
    return;
  }
  console.log('id', auctionId);
  ctx.reply(
    `https://t.me/${process.env.AUCTION_BOT_NAME}?start=${auctionId}`
  );
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
