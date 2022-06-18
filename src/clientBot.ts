import {Telegraf} from 'telegraf';
import 'dotenv/config';
import {ClientAppContext} from './types';
import {Auction, AuctionRepository} from './db/AuctionRepository';
import {
  BidController,
  BidVolunteerController,
} from './controllers/BidController';
import {launchBot} from './launchBot';
import {ClientRepository} from './db/Client';
import {getDb} from './db/connection';
import {session} from 'telegraf-session-mongodb';

const DB_URL = process.env.DB_URL;
const DB_NAME = process.env.DB_NAME;

if (!process.env.BOT_TOKEN) {
  throw new Error('no BOT_TOKEN provided');
}

if (!DB_URL || !DB_NAME) {
  throw new Error('DB is not configured well');
}

export const clientBot = new Telegraf<ClientAppContext>(process.env.BOT_TOKEN);

getDb().then(db => {
  clientBot.use(session(db, {collectionName: 'clientSessions'}));
  clientBot.use(async (ctx, next) => {
    ctx.db = db;
    ctx.session ??= {};
    return next();
  });

  clientBot.start(async ctx => {
    const auctionId = ctx.startPayload || null;
    if (!auctionId) {
      await ctx.reply(
        'Наразі ми не підтримуємо пошук аукціиону, ви можете перейти за лінкою конкретного аукціону, яку кинув волонтер для того щоб робити ставки'
      );
      return;
    }
    const auctionRepo = new AuctionRepository(ctx.db);
    let auction: Auction | null = null;
    try {
      auction = await auctionRepo.findOne(auctionId);
    } catch (err) {
      await ctx.reply('Щось не так, нема такого аукціону(');
      return;
    }
    if (!auction) {
      await ctx.reply('Щось не так, нема такого аукціону(');
      return;
    }
    ctx.session.auction = auction;
    const clientRepository = new ClientRepository('clients', ctx.db);
    ctx.session.client = await clientRepository.register({
      telegramId: ctx.from.id,
      username: ctx.from.username,
      chatId: ctx.chat.id,
    });
    // console.log('auction.photos', auction.photos);

    const caption = `${auction.title}
${auction.description}`;
    ctx.reply(caption);
    const photoSizes = auction.photos;
    try {
      await ctx.replyWithPhoto(photoSizes[photoSizes.length - 1].file_id, {
        caption,
      });
    } catch (err) {
      await ctx.reply(caption);
    }
  });

  clientBot.command('test', async ctx => {
    ctx.reply('Hello!');
    ctx.reply("I'm 'hackaton-auction-bot'");
    ctx.reply(
      `You are @${ctx.message.from.username}. Your id – ${ctx.message.from.id}`
    );
    await ctx.replyWithPhoto(
      'AgACAgIAAxkBAAMfYqslt567Db5L6qnn0a7RjFM9OnYAAlq8MRvH22FJgbWozqFukfgBAAMCAANzAAMkBA'
    );
    await ctx.reply(
      (
        await clientBot.telegram.getFileLink(
          'AgACAgIAAxkBAAIBD2Ksxa19fZ77rspkVeA_YscVKD4sAAI-vDEbUpphSU35cEKY_DSeAQADAgADcwADJAQ'
        )
      ).href
    );
    await ctx.replyWithPhoto(
      'AgACAgIAAxkBAAIBD2Ksxa19fZ77rspkVeA_YscVKD4sAAI-vDEbUpphSU35cEKY_DSeAQADAgADcwADJAQ'
    );
    // clientBot.on('photo', ctx => {
    //   ctx.reply(JSON.stringify(ctx.message.photo, null, 2));
    //   ctx.replyWithPhoto(ctx.message.photo[0].file_id);
    // });
  });

  clientBot.command('make_bid', async ctx => {
    const betController = new BidController(ctx);

    await betController.makeBid();
  });

  clientBot.command('subscribe', async ctx => {
    await ctx.reply('Ви підписались на оновлення');
  });

  clientBot.command('unsubscribe', async ctx => {
    await ctx.reply('Ви відписались від оновлень');
  });

  clientBot.command('max_bid', ctx => {
    ctx.reply('Максимальна ставка 100500');
  });

  clientBot.command('about', ctx => {
    ctx.reply('У цьому боті ви можете робити ставку');
  });

  clientBot.command('all', async ctx => {
    const tmp = new BidVolunteerController(ctx as any);

    await tmp.getListOfBets();
  });

  launchBot(clientBot);
});
// Enable graceful stop
process.once('SIGINT', () => clientBot.stop('SIGINT'));
process.once('SIGTERM', () => clientBot.stop('SIGTERM'));
