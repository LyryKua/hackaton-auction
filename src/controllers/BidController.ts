import {Context, NarrowedContext, Telegraf} from 'telegraf';
import {AppContext, ClientAppContext} from '../types';
import {BidRepository} from '../db/BidRepository';
import {MountMap} from 'telegraf/typings/telegram-types';

class BidControllerBase<C extends Context> {
  constructor(
    protected bot: Telegraf<C>,
    protected ctx: NarrowedContext<C, MountMap['text']>
  ) {}
}

export class BidController extends BidControllerBase<ClientAppContext> {
  async makeBid() {
    const bidRepository = new BidRepository(this.ctx.db);
    const bidAmountStr = this.ctx.message.text.split(' ')[1];
    if (String(Number(bidAmountStr)) !== bidAmountStr) {
      await this.ctx.reply(
        'Бумласочка, введіть суму цифрами в форматі /make_bid 1000'
      );
      return;
    }
    const bidAmount = Number(bidAmountStr);
    const currentAuction = this.ctx.session.auction;
    if (!currentAuction) {
      console.log('what do we do?');
      await this.ctx.reply(
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
    await this.ctx.reply('Ставка прийнята');
  }
}

export class BidVolunteerController extends BidControllerBase<AppContext>{
  async getHighestBet() {
    const bidRepository = new BidRepository(this.ctx.db);
    const highestBid = await bidRepository.findHighest();

    await this.ctx.reply(
      `Найбільша ставка: ${highestBid.amount} від ${highestBid.userId}`
    );
  }

  async getListOfBets() {
    const bidRepo = new BidRepository(this.ctx.db);
    const bids = await bidRepo.findAll();
    await this.ctx.reply('Here they all are right from the DB');
    await this.ctx.reply(JSON.stringify(bids, null, 2));
  }
}
