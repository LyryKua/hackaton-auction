import {ObjectId, WithId} from 'mongodb';
import {Auction} from './AuctionRepository';
import {RepositoryBase} from './BaseRepository';

export interface Bid {
  userId: string;
  auction: Auction;
  amount: number;
  createdAt: Date;
}

type DbBid = WithId<{
  userId: string;
  auctionId: string;
  amount: number;
  createdAt: Date;
}>;

export class BidRepository extends RepositoryBase<Bid> {
  collectionName = 'bets';

  async makeBid(bid: Omit<Bid, 'createdAt'>) {
    return await this.collection<Omit<DbBid, '_id'>>().insertOne({
      amount: bid.amount,
      auctionId: bid.auction.id,
      createdAt: new Date(),
      userId: bid.userId,
    });
  }

  async findAll(): Promise<DbBid[]> {
    const cursor = this.collection().find<DbBid>({});
    return cursor.toArray();
  }

  async findHighest(): Promise<DbBid> {
    const cursor = this.collection().find<DbBid>({}).sort({age: -1}).limit(1);
    const t = await cursor.toArray();
    return t[0];
  }

  async findBetById(id: string) {
    const bet = await this.collection().findOne({
      _id: new ObjectId(id),
    });
    if (!bet) {
      return null;
    }
    return bet;
  }
}
