import {Telegraf, Context} from 'telegraf';
import 'dotenv/config';
import {Db, MongoClient} from 'mongodb';
import {
  AuctionRepository,
  ExampleShared,
  launchBot,
  mockAuctions,
} from 'hackaton-auction-common';

const example = new ExampleShared();
example.test();

const url = 'mongodb://localhost:27017/'; // TODO: move it to `.env`
const DB_NAME = 'auction_bot'; // TODO: move it to `.env`

if (!process.env.BOT_TOKEN) {
  throw new Error('no BOT_TOKEN provided');
}

interface AppContext extends Context {
  db: Db;
}

const bot = new Telegraf<AppContext>(process.env.BOT_TOKEN);

bot.use(async (ctx, next) => {
  const connection = await MongoClient.connect(url);
  ctx.db = connection.db(DB_NAME);
  return next();
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
  })
});


bot.command('make_bit', ctx => {
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
  bot.on('photo', ctx => {
    ctx.reply(JSON.stringify(ctx.message.photo, null, 2));
    ctx.replyWithPhoto(ctx.message.photo[0].file_id);
  })
});

const SUPER_ADMINS = [ // devs you can add your user id here
    45412931
];

bot.command('clear_mock', async ctx => {
  const userId = ctx.message.from.id;
  if (!SUPER_ADMINS.includes(userId)) {
    ctx.reply('Сильно хитрий?')
    return;
  }
  ctx.reply('You are about to clear Auctions collection, like I mean are you mad? You sure? Y / N')
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
        ctx.reply('I told you Y or N, is it not clear? 🙄')
    }
  });

  console.log('userId', userId);
})

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

launchBot(bot);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
