import {Telegraf, session} from 'telegraf';
import 'dotenv/config';
import {MongoClient} from 'mongodb';
import {AppContext, ClientAppContext} from './types';
import {AuctionRepository} from './db/AuctionRepository';
import {BidController, BidVolunteerController} from './controllers/BidController';
import {launchBot} from './launchBot';
import {ClientRepository} from './db/Client';

const DB_URL = process.env.DB_URL;
const DB_NAME = process.env.DB_NAME;

if (!process.env.BOT_TOKEN) {
  throw new Error('no BOT_TOKEN provided');
}

if (!DB_URL || !DB_NAME) {
  throw new Error('DB is not configured well');
}

export const clientBot = new Telegraf<ClientAppContext>(process.env.BOT_TOKEN);

// TODO: this is a deprecated in-memory session, we might want to use a different one
clientBot.use(session());
clientBot.use(async (ctx, next) => {
  const connection = await MongoClient.connect(DB_URL);
  ctx.db = connection.db(DB_NAME);
  ctx.session ??= {};
  return next();
});

clientBot.start(async ctx => {
  const auctionId = ctx.startPayload;
  const auctionRepo = new AuctionRepository(ctx.db);
  const auction = await auctionRepo.findOne(auctionId);
  if (!auction) {
    ctx.reply('Щось не так, нема такого аукціону(');
    ctx.reply(JSON.stringify(await auctionRepo.findAll(), null, 2));
    return;
  }
  ctx.session.auction = auction;
  const clientRepository = new ClientRepository(ctx.db);
  ctx.session.client = await clientRepository.register({
    telegramId: ctx.from.id,
    username: ctx.from.username,
    chatId: ctx.chat.id,
  });
  // console.log('auction.photos', auction.photos);

  const caption = `${auction.title}
${auction.description}`;
  ctx.reply(caption);
  await ctx.replyWithPhoto(auction.photos[0].file_id, {
    caption,
  });
});

clientBot.command('test', ctx => {
  ctx.reply('Hello!');
  ctx.reply("I'm 'hackaton-auction-bot'");
  ctx.reply(
    `You are @${ctx.message.from.username}. Your id – ${ctx.message.from.id}`
  );
  clientBot.on('photo', ctx => {
    ctx.reply(JSON.stringify(ctx.message.photo, null, 2));
    ctx.replyWithPhoto(ctx.message.photo[0].file_id);
  });
});

clientBot.command('make_bid', async ctx => {
  const betController = new BidController(ctx);

  betController.makeBid();
});

clientBot.command('subscribe', ctx => {
  ctx.reply('Ви підписались на оновлення');
});

clientBot.command('unsubscribe', ctx => {
  ctx.reply('Ви відписались від оновлень');
});

clientBot.command('max_bid', ctx => {
  ctx.reply('Максимальна ставка 100500');
});

clientBot.command('about', ctx => {
  ctx.reply('У цьому боті ви можете робити ставку');
});

clientBot.command('all', async ctx => {
  const tmp = new BidVolunteerController(ctx as any)

  await tmp.getListOfBets()
})

launchBot(clientBot);

// Enable graceful stop
process.once('SIGINT', () => clientBot.stop('SIGINT'));
process.once('SIGTERM', () => clientBot.stop('SIGTERM'));
