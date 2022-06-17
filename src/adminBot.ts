import {session, Telegraf} from 'telegraf';
import 'dotenv/config';
import {MongoClient} from 'mongodb';
import {CreateAuctionController} from './controllers/createAuction';
import {AppContext} from './types';
import {AuctionRepository} from './db/AuctionRepository';
import {mockAuctions} from './db/mockData';
import {BidVolunteerController} from './controllers/BidController';
import {launchBot} from './launchBot';
import {ClientRepository} from './db/Client';
import {clientBot} from './clientBot';
import {VolunteerRepository} from './db/Volunteer';
import {BidRepository} from "./db/BidRepository";

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

adminBot.use(Telegraf.log())

adminBot.use(async (ctx, next) => {
  const connection = await MongoClient.connect(DB_URL);
  ctx.db = connection.db(DB_NAME);
  return next();
});

adminBot.use(session());
adminBot.start(async ctx => {
  console.log(ctx.message);
  console.log(ctx.from);
  const volunteerRepository = new VolunteerRepository(ctx.db);
  ctx.session.volunteer = await volunteerRepository.register({
    telegramId: ctx.from.id,
    username: ctx.from.username,
    chatId: ctx.chat.id,
  });
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
  const auctionRepo = new AuctionRepository(ctx.db);
  await auctionRepo.deleteMany();
  await ctx.reply('DB cleared');
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
  await ctx.reply('Here they all are right from the DB', {
    reply_markup: {
      inline_keyboard: auctions.map(auction => ([{
        text: auction.title,
        callback_data: auction.id,
      }]))
    }
  });

  adminBot.action(auctions.map(a => a.id), async (ctx) => {
    const matchedAuction = auctions.find(auction => auction.id === ctx.match[0])
    await ctx.reply(JSON.stringify(matchedAuction, null, 2), {
      reply_markup: {
        inline_keyboard: matchedAuction?.betIds.map(betId => [{
          text: betId,
          callback_data: betId,
        }]) ?? []
      }
    });

    adminBot.action(matchedAuction?.betIds ?? [], async (ctx) => {
      const betRepo = new BidRepository(ctx.db)
      const matchedBetId = matchedAuction!.betIds.find(betId => betId === ctx.match[0])
      const bet = await betRepo.findBetById(matchedBetId!)
      await ctx.reply(JSON.stringify(bet, null, 2));
    })
  })
});

adminBot.command('list_bits', async ctx => {
  ctx.reply('List of bids');
  const bidsController = new BidVolunteerController(ctx);
  await bidsController.getListOfBets();
});

adminBot.command('send_message_to_user', async ctx => {
  const [, username, message] = ctx.message.text.split(' ') as [
    string,
    string,
    string
  ];
  const clientRepository = new ClientRepository(ctx.db);
  const client = await clientRepository.findClientByUsername(username);
  if (!client) {
    await ctx.reply('No such user');
    return;
  }
  await clientBot.telegram.sendMessage(client.chatId, message);
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
  console.log('id', auctionId);
  ctx.reply(`https://t.me/${process.env.AUCTION_BOT_NAME}?start=${auctionId}`);
});

adminBot.command('bids', async ctx => {
  const bidController = new BidVolunteerController(ctx);
  await bidController.getHighestBet();
});

adminBot.command('close', ctx => {
  ctx.reply('Закрити аукціон');
});

launchBot(adminBot);

// Enable graceful stop
process.once('SIGINT', () => adminBot.stop('SIGINT'));
process.once('SIGTERM', () => adminBot.stop('SIGTERM'));
