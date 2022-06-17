import {NarrowedContext, Telegraf} from 'telegraf';
import {AppContext} from '../types';
import {BidRepository} from '../db/BidRepository';
import {MountMap} from 'telegraf/typings/telegram-types';

export class BidController {
  constructor(
    private bot: Telegraf<AppContext>,
    private ctx: NarrowedContext<AppContext, MountMap['text']>
  ) {}

  async makeBid() {
    const bidRepository = new BidRepository(this.ctx.db);
    const bidAmountStr = this.ctx.message.text.split(' ')[1];
    if (String(Number(bidAmountStr)) !== bidAmountStr) {
      this.ctx.reply(
        'Бумласочка, введіть суму цифрами в форматі /make_bid 1000'
      );
      return;
    }
    const bidAmount = Number(bidAmountStr);
    const currentAuction = this.ctx.session.auction;
    if (!currentAuction) {
      console.log('what do we do?');
      this.ctx.reply(
        'Якась халепа сталась, мабуть цей аукціон вже скінчився? Спробуйте перейти за лінкою аукціона ще раз'
      );
      return;
    }
    const bid = {
      userId: String(this.ctx.message?.from.id),
      auction: currentAuction,
      amount: bidAmount,
    };
    await bidRepository.makeBid(bid);
    this.ctx.reply('Ставка прийнята');
  }

  async getHighestBet() {
    const bidRepository = new BidRepository(this.ctx.db);
    const highestBid = await bidRepository.findHighest();

    this.ctx.reply(
      `Найбільша ставка: ${highestBid.amount} від ${highestBid.userId}`
    );
  }

  async getListOfBets() {
    const bidRepo = new BidRepository(this.ctx.db);
    const bids = await bidRepo.findAll();
    this.ctx.reply('Here they all are right from the DB');
    this.ctx.reply(JSON.stringify(bids, null, 2));
  }
}
