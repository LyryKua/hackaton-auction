import {Middleware, Scenes, Telegraf} from 'telegraf';
import {uniqBy} from 'lodash';
import 'dotenv/config';
import {AppContext, VolunteerSessionData} from './types';
import {AuctionRepository, NewAuction} from './db/AuctionRepository';
import {arrayOf, mockAuction, mockBid} from './db/mockData';
import {BidVolunteerController} from './controllers/BidController';
import {launchBot} from './launchBot';
import {ClientRepository} from './db/Client';
import {clientBot} from './clientBot';
import {BidRepository} from './db/BidRepository';
import {
  SceneContextScene,
  SceneSession,
  SceneSessionData,
} from 'telegraf/typings/scenes';
import {AuctionService} from './services/AuctionService';
import {randomUUID} from 'crypto';
import {VolunteerService} from './services/VolunteerService';
import {BidService} from './services/BidService';
import {getDb} from './db/connection';
import {session} from 'telegraf-session-mongodb';

const CREATE_AUCTION_SCENE = 'CREATE_AUCTION_SCENE2';

const auctionFields = [
  {id: 'title', prompt: 'Назва аукціону'},
  {id: 'description', prompt: 'Опис аукціону'},
  {id: 'photos', prompt: 'Додай мінімум одне фото'},
  {id: 'startBid', prompt: 'Яка початкова ставка?'},
];

interface AuctionSceneSession extends SceneSession<SceneSessionData> {
  auctionData: NewAuction;
}

interface AuctionSceneContext extends AppContext {
  session: VolunteerSessionData & AuctionSceneSession;
  scene: SceneContextScene<AuctionSceneContext, SceneSessionData>;
}

// interface AuctionSceneSession extends VolunteerSessionData {
//   auctionData: NewAuction;
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
    const auctionRepo = new AuctionRepository(ctx.db);
    const volunteer = ctx.session.volunteer;
    if (volunteer) {
      ctx.session.activeAuction =
        (await auctionRepo.findActive(volunteer.id)) || undefined;
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
      createAuctionScene.leave();
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
    const next = async () => {
      currentStep++;
      if (currentStep < auctionFields.length) {
        await ctx.reply(auctionFields[currentStep].prompt);
      } else {
        const auctionsService = new AuctionService(ctx.db);
        const newAuction: NewAuction = {
          ...auctionData,
          volunteerId: volunteer.id,
          status: 'opened',
        };
        const auction = await auctionsService.create(newAuction);
        ctx.session.activeAuction = auction;
        await ctx.reply(`Вітаю!
Аукціон створено.
Наступний крок — залучити якнайбільше учасників.
Посилання на аукціон: https://t.me/${process.env.AUCTION_BOT_NAME}?start=${auction.id}`);
        createAuctionScene.leave();
      }
    };
    await ctx.reply(auctionFields[currentStep].prompt);
    const auctionData: NewAuction = {
      title: '',
      description: '',
      photos: [],
      startBid: 0,
      volunteerId: volunteer.id,
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
          await next();
          break;
        }
        case 'description': {
          auctionData.description = ctx.message.text;
          await next();
          break;
        }
        case 'startBid': {
          auctionData.startBid = Number(ctx.message.text);
          await next();
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
          auctionData.photos = ctx.message.photo;
          await next();
          break;
        }
        default:
          break;
      }
    });
  });

  adminBot.start(async ctx => {
    const volunteerService = new VolunteerService(ctx.db);

    const {id: telegramId} = ctx.from;
    const volunteer = {
      id: randomUUID(),
      telegramId,
    };
    await volunteerService.create(volunteer);
    ctx.session.volunteer = volunteer;

    await ctx.reply(` 
Вітаю!

Користуватися цим ботом дуже легко. Основні команди:

/about - Як користуватися ботом 
/create - Створити аукціон
/edit - Редагувати аукціон
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

  const SUPER_ADMINS = [
    // devs you can add your user id here
    45412931,
    246078859,
    40419532, // kyryloh@wix.com
  ];

  adminBot.command('clear_mock', async ctx => {
    const userId = ctx.message.from.id;
    if (!SUPER_ADMINS.includes(userId)) {
      ctx.reply('Сильно хитрий?');
      return;
    }
    const auctionsService = new AuctionService(ctx.db);
    await auctionsService.deleteAll();
    const bidService = new BidService(ctx.db);
    await bidService.deleteAll();
  });

  adminBot.command('fill_mock', async ctx => {
    const auctions = arrayOf(3, () => mockAuction());
    const bids = arrayOf(6, () => mockBid());

    const auctionsService = new AuctionService(ctx.db);
    for (const auction of auctions) {
      await auctionsService.create(auction);
    }
    const bidService = new BidService(ctx.db);
    for (const bid of bids) {
      await bidService.create(bid);
    }
    await ctx.reply(
      'Created a couple of mock auctions for you, anything else?'
    );
  });

  adminBot.command('list_a', async ctx => {
    const auctionRepo = new AuctionRepository(ctx.db);
    const auctions = await auctionRepo.findAll();
    await ctx.reply('Here they all are right from the DB', {
      reply_markup: {
        inline_keyboard: auctions.map(auction => [
          {
            text: auction.title,
            callback_data: auction.id,
          },
        ]),
      },
    });

    adminBot.action(
      auctions.map(a => a.id),
      async ctx => {
        const matchedAuction = auctions.find(
          auction => auction.id === ctx.match[0]
        );
        if (!matchedAuction) {
          await ctx.reply('no matched auction')
          return
        }
        const bidRepo = new BidRepository(ctx.db)
        const bids = await bidRepo.findAll({auctionId: matchedAuction.id})
        const caption = `Title: *${matchedAuction.title}*\nDescription: *${matchedAuction.description}*\nStatus: *${matchedAuction.status}*\nstartBid: *${matchedAuction.startBid}*\n`
        await ctx.replyWithPhoto(matchedAuction.photos[0].file_id, {
          caption, parse_mode: 'MarkdownV2', reply_markup: {
            inline_keyboard: bids.map(bid => [{
              text: `user: ${bid.clientId} – ${bid.amount}`,
              callback_data: 'test',
            }]) // TODO: get by uniq user and highes bids
          }
        })
      }
    );
  });

  adminBot.command('list_bids', async ctx => {
    await ctx.reply('List of bids');
    const bidsController = new BidVolunteerController(ctx);
    await bidsController.getListOfBets();
  });

  adminBot.command('send_message_to_user', async ctx => {
    const [, username, message] = ctx.message.text.split(' ') as [
      string,
      string,
      string
    ];
    const clientRepository = new ClientRepository('clients', ctx.db);
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
/bets - Подивитися останні 3 ставки.
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
    const bidRepository = new BidRepository(ctx.db);
    const {activeAuction} = ctx.session;
    if (!activeAuction) {
      await ctx.reply(
        'В вас наразі немає активного аукціону. Щоб створити команда /create'
      );
      return;
    }
    const highestBid = await bidRepository.findHighest(activeAuction.id);
    if (!highestBid) {
      await ctx.reply('Не було жодних ставок. Finish this flow');
      return;
    }
    const clientRepository = new ClientRepository('clients', ctx.db);
    const client = await clientRepository.findById(highestBid.clientId);
    const allBids = await bidRepository.findAll({auctionId: activeAuction.id})
    if (!client) {
      await ctx.reply(
        'Щось не так, може бути. Мабуть, треба врчуну подивитись /bids та написати в ручну, сорі за це('
      );
      return;
    }
    try {
      for (const bid of uniqBy(allBids, 'clientId')) {
        const participant = await clientRepository.findById(bid.clientId)
        if (!participant) {
          await ctx.reply(
              'Щось не так, може бути. Мабуть, треба врчуну подивитись /bids та написати в ручну, сорі за це('
          );
          return
        }
        await clientBot.telegram.sendMessage(participant.chatId!, 'Привіт, аукціон завершенно вставити сюди текст')
      }
      await clientBot.telegram.sendMessage(
        client.chatId,
        'Привіт, ти виграв на аукціоні, поставити сюди текст!'
      );
    } catch (err) {
      console.error(err);
      await ctx.reply(
        'Щось не так, може бути. Мабуть, треба врчуну подивитись /bids та написати в ручну, сорі за це('
      );
      return;
    }
    await ctx.reply(`Вітаю, аукціон «Назва» завершено!
Переможцем став @${client.username}.
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
