import {Context, Telegraf} from 'telegraf';

export const launchBot = <T extends Context>(bot: Telegraf<T>) => {
  bot
    .launch()
    .catch(reason => {
      console.error('failed to launch', reason);
      bot.stop(reason);
    })
    .then(() => {
      console.log(
        'Bot is up and running',
        bot.botInfo,
        `https://t.me/${bot.botInfo?.username}`
      );
    });
};
