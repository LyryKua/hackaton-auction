import {Db, Filter, Sort, WithId} from 'mongodb';
import {RepositoryBase} from './BaseRepository';
import {randomUUID} from "crypto";

export const BIDS_COLLECTION = 'bids';

export type Bid = {
  id: string;
  auctionId: string;
  clientId: string;
  amount: number;
};

type DbBid = WithId<Bid>;

const transformBid = ({_id, ...dbBid}: DbBid) => ({
  ...dbBid,
  id: _id.toString(),
});

export class BidRepository extends RepositoryBase<Bid> {
  constructor(db: Db) {
    super(BIDS_COLLECTION, db);
  }

  async deleteMany(filter: Filter<Bid> = {}) {
    await this.db.collection(BIDS_COLLECTION).deleteMany(filter);
  }

  async makeBid(bid: Omit<Bid, 'createdAt' | 'id'>) {
    console.log('inserting with client id', bid.clientId);
    console.log(typeof bid.clientId)
    return await this.db.collection(BIDS_COLLECTION).insertOne({
      amount: bid.amount,
      auctionId: bid.auctionId,
      clientId: bid.clientId,
      id: randomUUID(),
    });
  }

  async findAll(filter: Filter<Bid> = {}): Promise<Bid[]> {
    const cursor = this.collection().find<DbBid>(filter);
    const dbBids = await cursor.toArray();
    return dbBids.map(transformBid);
  }

  async findHighest(auctionId: string): Promise<Bid | undefined> {
    const cursor = this.collection()
      .find<DbBid>({auctionId})
      .sort({amount: -1})
      .limit(1);
    const bids = await cursor.toArray();
    if (!bids.length) {
      return undefined;
    }
    return transformBid(bids[0]);
  }
}
