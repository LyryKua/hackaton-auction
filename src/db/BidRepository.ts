import {Db, Filter, ObjectId, WithId} from 'mongodb';
import {RepositoryBase} from './BaseRepository';
import {randomUUID} from 'crypto';

export const BIDS_COLLECTION = 'bids';

export type Bid = {
  id: string;
  auctionId: string;
  clientId: string;
  amount: number;
};

type DbBid = WithId<Bid>;

export class BidRepository extends RepositoryBase<Bid> {
  constructor(db: Db) {
    super(BIDS_COLLECTION, db);
  }

  async deleteMany(filter: Filter<Bid> = {}) {
    await this.db.collection(BIDS_COLLECTION).deleteMany(filter);
  }

  async makeBid(bid: Omit<Bid, 'createdAt' | 'id'>) {
    return await this.collection<Omit<DbBid, '_id'>>().insertOne({
      id: randomUUID(),
      amount: bid.amount,
      auctionId: bid.auctionId,
      clientId: bid.clientId,
    });
  }

  async findAll(): Promise<DbBid[]> {
    const cursor = this.collection().find<DbBid>({});
    return cursor.toArray();
  }

  async findHighest(auctionId: string): Promise<DbBid> {
    const cursor = this.collection()
      .find<DbBid>({auctionId})
      .sort({amount: -1})
      .limit(1);
    const bids = await cursor.toArray();
    return bids[0];
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
