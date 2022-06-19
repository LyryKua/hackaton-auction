import {Telegraf} from 'telegraf';
import 'dotenv/config';
import {AuctionMongoRepository, DbAuction} from './db/AuctionRepository';
import {ClientAppContext} from './types';
import {SubscriptionMongoRepository} from './db/SubscriptionRepository';
import {
  BidController,
  BidVolunteerController,
} from './controllers/BidController';
import {launchBot} from './launchBot';
import {ClientMongoRepository} from './db/ClientRepository';
import {getDb} from './db/connection';
import {session} from 'telegraf-session-mongodb';
import {BidMongoRepository} from './db/BidRepository';
import {PhotoMongoRepository} from './db/PhotoRepository';
import {InputMediaPhoto} from 'telegraf/types';

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
    const auctionRepo = new AuctionMongoRepository(ctx.db);
    let auction: DbAuction | null = null;
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

    if (auction.status !== 'opened') {
      await ctx.reply(
        'Нажаль цей аукціон вже завершено :( Зверніться до волонтера за отриманням лінки на новий аукціон '
      );
      return;
    }
    ctx.session.auction = auction;
    const clientRepository = new ClientMongoRepository(ctx.db);
    ctx.session.client = await clientRepository.register({
      telegramId: ctx.from.id,
      username: ctx.from.username,
      chatId: ctx.chat.id,
    });

    const caption = `${auction.title}
${auction.description}`;
    const photoRepository = new PhotoMongoRepository(ctx.db);
    const photos = await photoRepository.getForAuction(auction);

    try {
      if (!photos.length) {
        await ctx.reply(caption);
        return;
      }
      if (photos.length === 1) {
        const photo = photos[0];
        await ctx.replyWithPhoto(
          {source: photo.data},
          {
            caption,
          }
        );
        return;
      }
      // await ctx.replyWithPhoto({source: photo.data}, {caption});
      const mediaGroupReply: ReadonlyArray<InputMediaPhoto> = photos.map(
        photo => ({
          type: 'photo',
          media: {source: photo.data},
        })
      );
      await ctx.replyWithMediaGroup(mediaGroupReply);
      await ctx.reply(caption);
    } catch (err) {
      console.error(err);
      await ctx.reply('photo error');
    }
  });

  clientBot.command('test', async ctx => {
    ctx.reply('Hello!');
    ctx.reply("I'm 'hackaton-auction-bot'");
    ctx.reply(
      `You are @${ctx.message.from.username}. Your id – ${ctx.message.from.id}`
    );
    // await ctx.replyWithPhoto(
    //   'AgACAgIAAxkBAAMfYqslt567Db5L6qnn0a7RjFM9OnYAAlq8MRvH22FJgbWozqFukfgBAAMCAANzAAMkBA'
    // );
    // await ctx.reply(
    //   (
    //     await clientBot.telegram.getFileLink(
    //       'AgACAgIAAxkBAAIBD2Ksxa19fZ77rspkVeA_YscVKD4sAAI-vDEbUpphSU35cEKY_DSeAQADAgADcwADJAQ'
    //     )
    //   ).href
    // );
    // await ctx.replyWithPhoto(
    //   'AgACAgIAAxkBAAIBD2Ksxa19fZ77rspkVeA_YscVKD4sAAI-vDEbUpphSU35cEKY_DSeAQADAgADcwADJAQ'
    // );
    // clientBot.on('photo', ctx => {
    //   ctx.reply(JSON.stringify(ctx.message.photo, null, 2));
    //   ctx.replyWithPhoto(ctx.message.photo[0].file_id);
    // });
  });
  const informDefeatedBidderIfNecessary = async (
    ctx: ClientAppContext,
    defeatedBidder: string
  ) => {
    if (!ctx.session.auction?._id.toString()) {
      return;
    }
    const subscriptionRepo = new SubscriptionMongoRepository(ctx.db);
    const {result: isLostBidderSubscribed} =
      await subscriptionRepo.isClientSubscribed(
        ctx.session.auction?._id.toString(),
        defeatedBidder
      );
    if (isLostBidderSubscribed) {
      const clientRepository = new ClientMongoRepository(ctx.db);
      const client = await clientRepository.findById(defeatedBidder);
      if (!client) {
        await ctx.reply('No such user');
        return;
      }
      await clientBot.telegram.sendMessage(
        client.chatId,
        'Вашу ставку перебито'
      );
    }
  };

  clientBot.command('bid', async ctx => {
    const betController = new BidController(ctx);
    const {result, defeatedBidder} = await betController.makeBid();
    if (
      result === 'success' &&
      defeatedBidder &&
      ctx.session.client?._id.toString() !== defeatedBidder
    ) {
      await informDefeatedBidderIfNecessary(ctx, defeatedBidder);
    }
  });

  clientBot.command('subscribe', async ctx => {
    const subscriptionRepo = new SubscriptionMongoRepository(ctx.db);
    await subscriptionRepo.subscribe({
      auctionId: ctx.session.auction?._id.toString() || '',
      clientId: ctx.session.client?._id.toString() || '',
      type: 'active',
    });
    ctx.reply('Ви підписались на оновлення');
  });

  clientBot.command('unsubscribe', async ctx => {
    const subscriptionRepo = new SubscriptionMongoRepository(ctx.db);
    const result = await subscriptionRepo.unsubscribe({
      auctionId: ctx.session.auction?._id.toString() || '',
      clientId: ctx.session.client?._id.toString() || '',
    });
    if (result.ok) {
      await ctx.reply('Ви відписались від оновлень');
    } else {
      await ctx.reply('Щось пішло не так');
    }
  });

  clientBot.command('top', async ctx => {
    const auction = ctx.session.auction;
    if (!auction) {
      await ctx.reply(
        'Якась халепа сталась, спробуйте перейти за лінкою аукціона ще раз'
      );
      return;
    }
    if (auction.status !== 'opened') {
      await ctx.reply('Цей аукціон вже скінчився');
      return;
    }
    const bidRepository = new BidMongoRepository(ctx.db);
    const highestBid = await bidRepository.findHighest(auction._id.toString());
    if (!highestBid) {
      await ctx.reply('Ставок ще нема, введіть /bid щоб зробити ставку.');
      return;
    }
    await ctx.reply(`Лідируюча ставка – ${highestBid.amount}грн.`);
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
