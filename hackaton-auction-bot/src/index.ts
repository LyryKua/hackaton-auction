import {Telegraf, Context} from 'telegraf';
import 'dotenv/config';
import {Db, MongoClient} from 'mongodb';
import {
  Auction,
  AuctionRepository,
  Bid,
  BidRepository,
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

interface AppContext extends Context {
  db: Db;
  auction: Auction | null;
}

const bot = new Telegraf<AppContext>(process.env.BOT_TOKEN);

bot.use(async (ctx, next) => {
  const connection = await MongoClient.connect(DB_URL);
  ctx.db = connection.db(DB_NAME);
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
  ctx.auction = auction;
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
  console.log('make bid robe');
  const bidRepository = new BidRepository(ctx.db);
  const bidAmountStr = ctx.message.text.split(' ')[1];
  if (String(Number(bidAmountStr)) !== bidAmountStr) {
    ctx.reply('Бумласочка, введіть суму цифрами в форматі /make_bid 1000');
    return;
  }
  const bidAmount = Number(bidAmountStr);
  if (!ctx.auction) {
    console.log('what do we do?');
    ctx.reply(
      'Якась халепа сталась, мабуть цей аукціон вже скінчився? Спробуйте перейти за лінкою аукціона ще раз'
    );
    return;
  }
  const bid = {
    userId: String(ctx.message.from.id),
    auction: ctx.auction,
    amount: bidAmount,
  };
  await bidRepository.makeBid(bid);
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
