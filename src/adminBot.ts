import {Middleware, Scenes, Telegraf} from 'telegraf';
import {debounce, uniqBy} from 'lodash';
import 'dotenv/config';
import {AppContext, VolunteerSessionData} from './types';
import {Auction, AuctionMongoRepository} from './db/AuctionRepository';
import {BidVolunteerController} from './controllers/BidController';
import {launchBot} from './launchBot';
import {ClientMongoRepository} from './db/ClientRepository';
import {clientBot} from './clientBot';
import {BidMongoRepository} from './db/BidRepository';
import {
  SceneContextScene,
  SceneSession,
  SceneSessionData,
} from 'telegraf/typings/scenes';
import {AuctionService} from './services/AuctionService';
import {VolunteerService} from './services/VolunteerService';
import {getDb} from './db/connection';
import {session} from 'telegraf-session-mongodb';
import {Volunteer} from './db/VolunteerRepository';
import {Chat, User as TelegramUser} from 'telegraf/typings/core/types/typegram';

const CREATE_AUCTION_SCENE = 'CREATE_AUCTION_SCENE2';

const auctionFields = [
  {id: 'title', prompt: 'Назва аукціону'},
  {id: 'description', prompt: 'Опис аукціону'},
  {id: 'photos', prompt: 'Додай мінімум одне фото'},
  {id: 'startBid', prompt: 'Яка початкова ставка?'},
];

interface AuctionSceneSession extends SceneSession<SceneSessionData> {
  auctionData: Auction;
}

interface AuctionSceneContext extends AppContext {
  session: VolunteerSessionData & AuctionSceneSession;
  scene: SceneContextScene<AuctionSceneContext, SceneSessionData>;
}

// interface AuctionSceneSession extends VolunteerSessionData {
//   auctionData: Auction;
// }
//
// interface AuctionSceneContext extends AppContext {
//   session: VolunteerSessionData & AuctionSceneSession;
//   // scene: SceneContextScene<AuctionSceneContext, SceneSessionData>;
// }

// type WrapSceneSession<S extends {}, SSD extends SceneSessionData> = S &
//   SceneSession<SSD>;
//
// type WrapSceneContext<
//   C extends AppContext,
//   SSD extends SceneSessionData = SceneSessionData
// > = C & {
//   scene: SceneContextScene<
//     C & { session: C['session'] & SceneSession<SSD> },
//     SSD
//   >;
//   session: WrapSceneSession<C['session'], SSD>;
// };

const {BOT_ADMIN_TOKEN, DB_NAME, DB_URL} = process.env;
if (!BOT_ADMIN_TOKEN) {
  throw new Error('no BOT_ADMIN_TOKEN provided');
}

export const adminBot = new Telegraf<AppContext>(BOT_ADMIN_TOKEN);

adminBot.use(Telegraf.log());

const getVolunteerDataFromCtx = (ctx: {
  from: TelegramUser;
  chat: Chat;
}): Volunteer => ({
  telegramId: ctx.from.id,
  username: ctx.from.username,
  chatId: ctx.chat.id,
});
// adminBot.use(session());
getDb().then(db => {
  adminBot.use(session(db, {collectionName: 'adminSessions'}));

  adminBot.use(async (ctx, next) => {
    // const connection = await MongoClient.connect(DB_URL);
    ctx.db = db;
    ctx.session ??= {};
    return next();
  });

  adminBot.use(async (ctx, next) => {
    const auctionRepo = new AuctionMongoRepository(ctx.db);
    const volunteer = ctx.session.volunteer;
    if (volunteer) {
      ctx.session.activeAuction =
        (await auctionRepo.findActive(volunteer._id.toString())) || undefined;
    }
    return next();
  });

  const createAuctionScene = new Scenes.BaseScene<AuctionSceneContext>(
    CREATE_AUCTION_SCENE
  );
  createAuctionScene.enter(async ctx => {
    let currentStep = 0;
    const volunteer = ctx.session.volunteer;
    if (!volunteer) {
      await ctx.reply(
        'Щось мабуть пішло не так, дуже шкода, бумласка, спробуйте почати заново /start'
      );
      await ctx.scene.leave();
      return;
    }
    if (ctx.session.activeAuction) {
      if (ctx.session.activeAuction.status === 'closed') {
        delete ctx.session.activeAuction;
      } else {
        await ctx.reply(
          'В вас вже є активний аукціон, нажаль ми наразі тільки один. Ви зможете створити новий, коли закінчите цей.'
        );
        return;
      }
    }
    const next = async (ctx: AuctionSceneContext) => {
      currentStep++;
      if (currentStep < auctionFields.length) {
        await ctx.reply(auctionFields[currentStep].prompt);
      } else {
        const auctionsService = new AuctionService(ctx.db, adminBot);
        const newAuction: Auction = {
          ...auctionData,
          volunteerId: volunteer._id.toString(),
          status: 'opened',
        };
        const auction = await auctionsService.create(newAuction);
        ctx.session.activeAuction = auction;
        await ctx.reply(`Вітаю!
Аукціон створено.
Наступний крок — залучити якнайбільше учасників.
Посилання на аукціон: https://t.me/${
          process.env.AUCTION_BOT_NAME
        }?start=${auction._id.toString()}`);
        await ctx.scene.leave();
      }
    };
    const debouncedNext = debounce(next, 2000);
    await ctx.reply(auctionFields[currentStep].prompt);
    const auctionData: Auction = {
      title: '',
      description: '',
      photos: [],
      startBid: 0,
      volunteerId: volunteer._id.toString(),
      status: 'opened',
    };
    createAuctionScene.on('text', async ctx => {
      if (currentStep >= auctionFields.length) {
        return;
      }
      const currentField = auctionFields[currentStep].id;
      switch (currentField) {
        case 'title': {
          auctionData.title = ctx.message.text;
          await next(ctx);
          break;
        }
        case 'description': {
          auctionData.description = ctx.message.text;
          await next(ctx);
          break;
        }
        case 'startBid': {
          auctionData.startBid = Number(ctx.message.text);
          await next(ctx);
          break;
        }
        default:
          break;
      }
    });
    createAuctionScene.on('photo', async ctx => {
      if (currentStep >= auctionFields.length) {
        return;
      }
      const currentField = auctionFields[currentStep].id;
      switch (currentField) {
        case 'photos': {
          const photos = ctx.message.photo;
          auctionData.photos.push(photos[photos.length - 1]);
          await debouncedNext(ctx);
          break;
        }
        default:
          break;
      }
    });
  });

  adminBot.start(async ctx => {
    const volunteerService = new VolunteerService(ctx.db);

    const volunteer = getVolunteerDataFromCtx(ctx);
    ctx.session.volunteer = await volunteerService.getOrCreate(volunteer);

    await ctx.reply(` 
Вітаю!

Користуватися цим ботом дуже легко. Основні команди:

/about - Як користуватися ботом 
/create - Створити аукціон
/bids - Подивитися останні 3 ставки 
/close - Закрити аукціон

Всі ці команди ти можеш знайти в Меню.

Коли аукціон буде створено, ти отримаєш посилання на бота для учасників.

Не гаємо часу і розпочинаємо! 
Успіхів.`);
  });

  // type AuctionStageContext = WrapSceneContext<AuctionSceneContext>;
  // TODO: do it more properly with the wrapper
  const stage = new Scenes.Stage<AuctionSceneContext>([createAuctionScene]);
  adminBot.use(stage.middleware() as unknown as Middleware<AppContext>);

  adminBot.command('create', ctx => {
    // @ts-ignore
    ctx.scene.enter(CREATE_AUCTION_SCENE);
  });

  adminBot.command('edit', ctx => {
    ctx.reply('Редагувати');
  });

  adminBot.command('send_message_to_user', async ctx => {
    const [, username, message] = ctx.message.text.split(' ') as [
      string,
      string,
      string
    ];
    const clientRepository = new ClientMongoRepository(ctx.db);
    const client = await clientRepository.findClientByUsername(
      username.replace('@', '')
    );
    if (!client) {
      await ctx.reply('No such user');
      return;
    }
    await clientBot.telegram.sendMessage(
      client.chatId,
      message || 'empty message'
    );
  });

  adminBot.command('about', ctx => {
    ctx.reply(`Користуватися ботом дуже легко. Дивися:
/create - Створити аукціон. Придумай назву для аукціону, додай фото, початкову ставку та опис (деталі, ціль збору коштів та все, щоб заохотити учасників).
Коли аукціон створено, ти отримаєш готове посилання на бота для учасників. Поділися ним в соціальних мережах, аби більше людей знали про твій аукціон.
/bids - Подивитися останні 3 ставки.
`);
  });

  adminBot.command('show_link', ctx => {
    const auctionId = ctx.message.text.split(' ')[1];
    if (!auctionId) {
      ctx.reply('please pass the id, run /show_link ID');
      return;
    }
    ctx.reply(
      `https://t.me/${process.env.AUCTION_BOT_NAME}?start=${auctionId}`
    );
  });

  adminBot.command('bids', async ctx => {
    const bidController = new BidVolunteerController(ctx);
    await bidController.handleHighestBid();
  });

  adminBot.command('close', async ctx => {
    const bidRepository = new BidMongoRepository(ctx.db);
    const {activeAuction} = ctx.session;
    const volunteerService = new VolunteerService(ctx.db);
    const volunteer = await volunteerService.getOrCreate(
      getVolunteerDataFromCtx(ctx)
    );
    if (!activeAuction || activeAuction.status !== 'opened') {
      await ctx.reply(
        'В вас наразі немає активного аукціону. Щоб створити команда /create'
      );
      return;
    }
    const highestBid = await bidRepository.findHighest(
      activeAuction._id.toString()
    );
    const auctionRepository = new AuctionMongoRepository(ctx.db);
    if (!highestBid) {
      await ctx.reply('Не було жодних ставок. Закриваємо так');
      await auctionRepository.close(
        activeAuction._id.toString(),
        volunteer._id.toString()
      );
      return;
    }
    const clientRepository = new ClientMongoRepository(ctx.db);
    const winnerClient = await clientRepository.findById(highestBid.clientId);
    const allBids = await bidRepository.findAll({
      auctionId: activeAuction._id.toString(),
    });
    if (!winnerClient) {
      await ctx.reply(
        'Щось не так, може бути. Мабуть, треба врчуну подивитись /bids та написати в ручну, сорі за це('
      );
      return;
    }
    try {
      for (const bid of uniqBy(
        allBids.filter(({clientId}) => clientId !== highestBid.clientId),
        'clientId'
      )) {
        const participant = await clientRepository.findById(bid.clientId);
        if (!participant) {
          await ctx.reply(
            'Щось не так, може бути. Мабуть, треба врчуну подивитись /bids та написати в ручну, сорі за це('
          );
          return;
        }
        await clientBot.telegram.sendMessage(
          participant.chatId,
          `Привіт! Як справи?
А в нас новина - Аукціон “${activeAuction.title}” завершено.
Перемогла ставка, грн. - ${highestBid.amount}
Не твоя? Не журись.
Пощастить в житті. Чи наступному аукціоні!
Дякуємо за участь.`
        );
      }
      await clientBot.telegram.sendMessage(
        winnerClient.chatId,
        `Та-дам! Вітаємо з перемогою в аукціоні!
Твоя переможна ставка, грн - ${highestBid.amount}
Протягом кількох днів організатор аукціону повідомить тебе про умови оплати та доставки.
Було круто, еге ж?
Щасти.`
      );
    } catch (err) {
      console.error(err);
      await ctx.reply(
        'Щось не так, може бути. Мабуть, треба врчуну подивитись /bids та написати в ручну, сорі за це('
      );
      return;
    }

    await auctionRepository.close(
      activeAuction._id.toString(),
      volunteer._id.toString()
    );
    delete ctx.session.activeAuction;
    await ctx.reply(`Вітаю, аукціон «Назва» завершено!
Переможцем став @${winnerClient.username}.
Переможна ставка склала UAH ${highestBid.amount}
Бот відправив привітальне повідомлення. 
Не забудь надіслати деталі оплати та доставки.

Гайда створювати новий аукціон? ( /create )`);
  });

  launchBot(adminBot);
});
// Enable graceful stop
process.once('SIGINT', () => adminBot.stop('SIGINT'));
process.once('SIGTERM', () => adminBot.stop('SIGTERM'));
