import {Context, NarrowedContext, Telegraf} from 'telegraf';
import {AppContext, ClientAppContext} from '../types';
import {Bid, BidRepository} from '../db/BidRepository';
import {MountMap} from 'telegraf/typings/telegram-types';
import {AuctionRepository} from '../db/AuctionRepository';
import {ClientRepository} from '../db/Client';
import {isValidByAmount, validateByExists} from '../validators/bidValidators';

class BidControllerBase<C extends Context> {
  constructor(protected ctx: NarrowedContext<C, MountMap['text']>) {}
}

export class BidController extends BidControllerBase<ClientAppContext> {
  async makeBid() {
    const client = this.ctx.session.client;
    if (!client) {
      await this.ctx.reply(
        'Ой, щось пішло геть не так, спробуйте заново зайти за лінкою на аукціон?'
      );
      return;
    }
    const bidRepository = new BidRepository(this.ctx.db);
    const auctionRepository = new AuctionRepository(this.ctx.db);
    const bidAmountStr = this.ctx.message.text.split(' ')[1];
    const notExistErrorMessage = validateByExists(bidAmountStr);

    if (notExistErrorMessage) {
      await this.ctx.reply(notExistErrorMessage);
      return;
    }

    const bidAmount = Number(bidAmountStr);
    const currentAuction = this.ctx.session.auction;

    if (!currentAuction) {
      await this.ctx.reply(
        'Якась халепа сталась, мабуть цей аукціон вже скінчився? Спробуйте перейти за лінкою аукціона ще раз'
      );
      return;
    }

    const notEnoughAmountErrorMessage = await isValidByAmount(
      bidRepository,
      currentAuction,
      bidAmount
    );

    if (notEnoughAmountErrorMessage) {
      await this.ctx.reply(notEnoughAmountErrorMessage);
      return;
    }

    const bid = {
      clientId: client.id,
      auctionId: currentAuction.id,
      amount: bidAmount,
    };
    const newBid = await bidRepository.makeBid(bid);

    console.log('test42', newBid.insertedId.toString(), currentAuction.id);
    await auctionRepository.update(
      currentAuction.id,
      newBid.insertedId.toString()
    );
    const tmp = await auctionRepository.findOne(currentAuction.id);
    console.log(tmp);
    await this.ctx.reply('Ставка прийнята');
  }
}

export class BidVolunteerController extends BidControllerBase<AppContext> {
  async handleHighestBid() {
    const bidRepository = new BidRepository(this.ctx.db);
    const activeAuction = this.ctx.session.activeAuction;
    if (!activeAuction) {
      await this.ctx.reply('Щоб створити аукціон введіть /create');
      return;
    }
    const highestBid = await bidRepository.findHighest(activeAuction.id);
    const clientRepo = new ClientRepository('clients', this.ctx.db);
    const user = await clientRepo.findById(highestBid.clientId);

    await this.ctx.reply(
      `Найбільша ставка: ${highestBid.amount} від ${
        user ? `${user.username}` : highestBid.clientId
      }`
    );
  }

  async getListOfBets() {
    const bidRepo = new BidRepository(this.ctx.db);
    const bids = await bidRepo.findAll();
    await this.ctx.reply('Here they all are right from the DB');
    await this.ctx.reply(JSON.stringify(bids, null, 2));
  }
}
