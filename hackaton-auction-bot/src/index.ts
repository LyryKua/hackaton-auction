import {Telegraf, session} from 'telegraf';
import 'dotenv/config';
import {MongoClient} from 'mongodb';
import {
  AppContext,
  AuctionRepository,
  BidController,
  ExampleShared,
  launchBot,
} from 'hackaton-auction-common';

const example = new ExampleShared();
example.test();

const DB_URL = process.env.DB_URL;
const DB_NAME = process.env.DB_NAME;

if (!process.env.BOT_TOKEN) {
  throw new Error('no BOT_TOKEN provided');
}

if (!DB_URL || !DB_NAME) {
  throw new Error('DB is not configured well');
}

const bot = new Telegraf<AppContext>(process.env.BOT_TOKEN);

// TODO: this is a deprecated in-memory session, we might want to use a different one
bot.use(session());
bot.use(async (ctx, next) => {
  const connection = await MongoClient.connect(DB_URL);
  ctx.db = connection.db(DB_NAME);
  ctx.session ??= {};
  return next();
});

bot.start(async ctx => {
  const auctionId = ctx.startPayload;
  const auctionRepo = new AuctionRepository(ctx.db);
  const auction = await auctionRepo.findOne(auctionId);
  if (!auction) {
    ctx.reply('Щось не так, нема такого аукціону(');
    ctx.reply(JSON.stringify(await auctionRepo.findAll(), null, 2));
    return;
  }
  ctx.session.auction = auction;
  // console.log('auction.photos', auction.photos);

  const caption = `${auction.title}
${auction.description}`;
  // ctx.reply(caption);
  await ctx.replyWithPhoto(auction.photos[0].file_id, {
    caption,
  });
});

bot.command('test', ctx => {
  ctx.reply('Hello!');
  ctx.reply("I'm 'hackaton-auction-bot'");
  ctx.reply(
    `You are @${ctx.message.from.username}. Your id – ${ctx.message.from.id}`
  );
  bot.on('photo', ctx => {
    ctx.reply(JSON.stringify(ctx.message.photo, null, 2));
    ctx.replyWithPhoto(ctx.message.photo[0].file_id);
  });
});

bot.command('make_bid', async ctx => {
  const betController = new BidController(bot as any, ctx);

  betController.makeBid();
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
