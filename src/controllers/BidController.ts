import {Context, NarrowedContext, Telegraf} from 'telegraf';
import {AppContext, ClientAppContext} from '../types';
import {BidMongoRepository, BidRepository} from '../db/BidRepository';
import {MountMap} from 'telegraf/typings/telegram-types';
import {ClientMongoRepository, ClientRepository} from '../db/ClientRepository';
import {isValidByAmount, validateByExists} from '../validators/bidValidators';

class BidControllerBase<C extends Context> {
  constructor(protected ctx: NarrowedContext<C, MountMap['text']>) {}
}
const errorResponse = {result: 'error', defeatedBidder: null};
export class BidController extends BidControllerBase<ClientAppContext> {
  async makeBid() {
    const client = this.ctx.session.client;
    if (!client) {
      await this.ctx.reply(
        'Ой, щось пішло геть не так, спробуйте заново зайти за лінкою на аукціон?'
      );
      return errorResponse;
    }
    const bidRepository = new BidMongoRepository(this.ctx.db);
    const bidAmountStr = this.ctx.message.text.split(' ')[1];
    const notExistErrorMessage = validateByExists(bidAmountStr);

    if (notExistErrorMessage) {
      await this.ctx.reply(notExistErrorMessage);
      return errorResponse;
    }

    const bidAmount = Number(bidAmountStr);
    const currentAuction = this.ctx.session.auction;

    if (!currentAuction) {
      await this.ctx.reply(
        'Якась халепа сталась, мабуть цей аукціон вже скінчився? Спробуйте перейти за лінкою аукціона ще раз'
      );
      return errorResponse;
    }

    const notEnoughAmountErrorMessage = await isValidByAmount(
      bidRepository,
      currentAuction,
      bidAmount
    );

    if (notEnoughAmountErrorMessage) {
      await this.ctx.reply(notEnoughAmountErrorMessage);
      return errorResponse;
    }

    const highestBid = await bidRepository.findHighest(currentAuction._id.toString());
    const bid = {
      clientId: client._id.toString(),
      auctionId: currentAuction._id.toString(),
      amount: bidAmount,
    };
    await bidRepository.makeBid(bid);
    await this.ctx.reply('Ставка прийнята');

    return {
      result: 'success',
      defeatedBidder: highestBid?.clientId,
    };
  }
}

export class BidVolunteerController extends BidControllerBase<AppContext> {
  async handleHighestBid() {
    const bidRepository = new BidMongoRepository(this.ctx.db);
    const activeAuction = this.ctx.session.activeAuction;
    console.log('activeAuction.status', activeAuction?.status);
    if (!activeAuction || activeAuction.status !== 'opened') {
      await this.ctx.reply('Щоб створити аукціон введіть /create');
      return;
    }
    const highestBids = await bidRepository.findLastHighest(activeAuction._id.toString(), 3);
    if (!highestBids.length) {
      await this.ctx.reply('Ставок ще не було.');
      return;
    }

    const clientRepo = new ClientMongoRepository(this.ctx.db);
    const users = await clientRepo.findUsers(
      highestBids.map(bid => bid.clientId)
    );
    const countWord: {[i: number]: string} = {
      1: 'Остання ставка',
      2: 'Останні дві ставки',
      3: 'Останні три ставки',
    };
    const title = countWord[highestBids.length];
    const showUser = (clientId: string) => {
      const user = users[clientId];
      if (user.username) {
        return `@${user.username}`;
      }
      return `tg://user?id=${user.telegramId}`;
    };

    await this.ctx.reply(
      `${title}:
${highestBids
  .map(bid => `- UAH ${bid.amount} від ${showUser(bid.clientId)}`)
  .join('\n')}`
    );
  }

  async getListOfBets() {
    const bidRepo = new BidMongoRepository(this.ctx.db);
    const bids = await bidRepo.findAll({});
    await this.ctx.reply('Here they all are right from the DB');
    await this.ctx.reply(JSON.stringify(bids, null, 2));
  }
}
