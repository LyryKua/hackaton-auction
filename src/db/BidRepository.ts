import {Db, Filter, WithId} from 'mongodb';

export const BIDS_COLLECTION = 'bids';

export type Bid = {
  auctionId: string;
  clientId: string;
  amount: number;
};

type DBBid = WithId<Bid>;

export interface BidRepository {
  deleteMany(filter: Filter<DBBid>): Promise<void>;

  makeBid(bid: Bid): Promise<DBBid>; // TODO: rename to create

  findAll(filter: Filter<DBBid>): Promise<DBBid[]>;

  findHighest(auctionId: string): Promise<DBBid | undefined>; // TODO: merge `findHighest` and `findLastHighest`

  findLastHighest(auctionId: string, count: number): Promise<Bid[]>;
}

export class BidMongoRepository implements BidRepository {
  constructor(private readonly db: Db) {}

  async deleteMany(filter: Filter<Bid> = {}) {
    await this.db.collection(BIDS_COLLECTION).deleteMany(filter);
  }

  async makeBid(bid: Bid): Promise<DBBid> {
    const { insertedId } = await this.db.collection<Bid>(BIDS_COLLECTION).insertOne(bid);

    return {
      ...bid,
      _id: insertedId,
    };
  }

  findAll(filter: Filter<DBBid>): Promise<DBBid[]> {
    const cursor = this.db.collection<Bid>(BIDS_COLLECTION).find<DBBid>(filter);

    return cursor.toArray();
  }

  async findHighest(auctionId: string): Promise<DBBid | undefined> {
    const cursor = this.db.collection<Bid>(BIDS_COLLECTION)
        .find({auctionId})
        .sort({amount: -1})
        .limit(1);
    const bids = await cursor.toArray();
    return bids[0]
  }

  findLastHighest(auctionId: string, count: number): Promise<Bid[]> {
    const cursor = this.db.collection<Bid>(BIDS_COLLECTION)
        .find<DBBid>({auctionId})
        .sort({amount: -1})
        .limit(count);
    return cursor.toArray();
  }
}
