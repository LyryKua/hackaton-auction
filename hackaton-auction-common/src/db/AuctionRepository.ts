import {Db, ObjectId, WithId} from 'mongodb';
import {PhotoSize} from 'typegram';

export interface Auction {
  id: string;
  title: string;
  description: string;
  photos: PhotoSize[];
  startBet: number;
  volunteerId: number | string;
}

export interface Bid {
  userId: string;
  auction: Auction;
  amount: number;
  createdAt: Date;
}

interface DBBid {
  userId: string;
  auctionId: string;
  amount: number;
  createdAt: Date;
}

export type NewAuction = Omit<Auction, 'id'>;

type DBAuction = WithId<NewAuction>;
// type WithNormalId<T extends Record<string, unknown>> = T & {id: string};
//
// const transformId = <T extends Record<string, unknown>>({
//   _id,
//   ...rest
// }: WithId<T>): Omit<T, '_id'> & {id: string} => {
//   const newVar = {
//     id: _id.toString(),
//     ...rest,
//   };
//   return newVar;
// };

const transformAuction = ({_id, ...auction}: DBAuction): Auction => ({
  id: _id.toString(),
  ...auction,
});

abstract class RepositoryBase<Model> {
  abstract collectionName: string;
  constructor(protected readonly db: Db) {}

  protected collection<T = Model>() {
    return this.db.collection<T>(this.collectionName);
  }
}
export class AuctionRepository extends RepositoryBase<Auction> {
  readonly collectionName: string = 'auctions';

  async create(auction: NewAuction): Promise<void> {
    await this.collection<NewAuction>().insertOne(auction);
  }

  async createMany(auctions: NewAuction[]): Promise<void> {
    await this.collection<NewAuction>().insertMany(auctions);
  }

  findAll(): Promise<Auction[]> {
    const cursor = this.collection().find<DBAuction>({});
    return cursor.map(transformAuction).toArray();
  }

  async findOne(auctionId: string): Promise<Auction | null> {
    const auction = await this.collection<Auction>().findOne({
      _id: new ObjectId(auctionId),
    });
    if (!auction) {
      return null;
    }
    return transformAuction(auction);
  }
}

export class BidRepository extends RepositoryBase<Bid> {
  collectionName = 'bids';

  async makeBid(bid: Omit<Bid, 'createdAt'>) {
    await this.collection<Omit<DBBid, '_id'>>().insertOne({
      amount: bid.amount,
      auctionId: bid.auction.id,
      createdAt: new Date(),
      userId: bid.userId
    });
  }
}
