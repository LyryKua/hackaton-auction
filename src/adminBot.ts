import {Telegraf} from 'telegraf';
import 'dotenv/config';
import {MongoClient} from 'mongodb';
import {CreateAuctionController} from './controllers/createAuction';
import {AppContext} from './types';
import {AuctionRepository} from './db/AuctionRepository';
import {mockAuctions} from './db/mockData';
import {BidController} from './controllers/BidController';
import {launchBot} from './launchBot';

const {BOT_ADMIN_TOKEN, DB_NAME, DB_URL} = process.env;

if (!BOT_ADMIN_TOKEN) {
  throw new Error('no BOT_ADMIN_TOKEN provided');
}
if (!DB_NAME) {
  throw new Error('no DB_NAME provided');
}
if (!DB_URL) {
  throw new Error('no DB_URL provided');
}

export const adminBot = new Telegraf<AppContext>(BOT_ADMIN_TOKEN);

adminBot.use(async (ctx, next) => {
  const connection = await MongoClient.connect(DB_URL);
  ctx.db = connection.db(DB_NAME);
  return next();
});

adminBot.command('create', ctx => {
  ctx.reply('Створити аукціон');
  const controller = new CreateAuctionController(adminBot, ctx);
  controller.start();
});

adminBot.command('edit', ctx => {
  ctx.reply('Редагувати');
});

const SUPER_ADMINS = [
  // devs you can add your user id here
  45412931,
  246078859,
  40419532, // kyryloh@wix.com
];

adminBot.command('clear_mock', async ctx => {
  const userId = ctx.message.from.id;
  if (!SUPER_ADMINS.includes(userId)) {
    ctx.reply(`Сильно хитрий?`);
    return;
  }
  ctx.reply(
    'You are about to clear Auctions collection, like I mean are you mad? You sure? Y / N'
  );
  adminBot.on('text', async ctx => {
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

adminBot.command('fill_mock', async ctx => {
  const auctionRepo = new AuctionRepository(ctx.db);
  const username = ctx.message.from.username;
  const userId = ctx.message.from.id;
  await auctionRepo.createMany(mockAuctions(username || String(userId)));
  ctx.reply('Created a couple of mock auctions for you, anything else?');
});

adminBot.command('list_a', async ctx => {
  const auctionRepo = new AuctionRepository(ctx.db);
  const auctions = await auctionRepo.findAll();
  await ctx.reply('Here they all are right from the DB');
  await ctx.reply(JSON.stringify(auctions, null, 2));
});

adminBot.command('list_bits', async ctx => {
  ctx.reply('List of bids');
  const bidsController = new BidController(adminBot, ctx);
  bidsController.getListOfBets();
});

adminBot.command('about', ctx => {
  console.log('about');
  ctx.reply(`Користуватися ботом дуже легко. Дивися:
/create - Створити аукціон. Придумай назву для аукціону, додай фото, початкову ставку та опис (деталі, ціль збору коштів та все, щоб заохотити учасників).
Коли аукціон створено, ти отримаєш готове посилання на бота для учасників. Поділися ним в соціальних мережах, аби більше людей знали про твій аукціон.
/bets - Подивитися останні 3 ставки.
`);
});

adminBot.command('show_link', (ctx, ...args) => {
  const auctionId = ctx.message.text.split(' ')[1];
  if (!auctionId) {
    ctx.reply('please pass the id, run /show_link ID');
    return;
  }
  console.log('id', auctionId);
  ctx.reply(`https://t.me/${process.env.AUCTION_BOT_NAME}?start=${auctionId}`);
});

adminBot.command('bids', async ctx => {
  const bidController = new BidController(adminBot, ctx);
  bidController.getHighestBet();
});

adminBot.command('close', ctx => {
  ctx.reply('Закрити аукціон');
});

launchBot(adminBot);

// Enable graceful stop
process.once('SIGINT', () => adminBot.stop('SIGINT'));
process.once('SIGTERM', () => adminBot.stop('SIGTERM'));
