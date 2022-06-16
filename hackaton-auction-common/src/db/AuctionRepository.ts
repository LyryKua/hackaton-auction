import type {Db} from 'mongodb';
import {PhotoSize} from 'typegram';

export interface Auction {
  id: string;
  title: string;
  description: string;
  photos: PhotoSize[];
  startBet: number;
  volunteerId: string;
}

export type NewAuction = Omit<Auction, 'id'>;

interface DBAuction extends Omit<Auction, 'id'> {
  _id: string;
}

const transformAuction = ({_id, ...auction}: DBAuction): Auction => ({
  id: _id,
  ...auction,
});
export class AuctionRepository {
  private readonly AUCTIONS_COLLECTION = 'auctions';

  constructor(protected readonly db: Db) {}

  async create(auction: NewAuction): Promise<void> {
    await this.db
      .collection<NewAuction>(this.AUCTIONS_COLLECTION)
      .insertOne(auction);
  }

  async createMany(auctions: NewAuction[]): Promise<void> {
    await this.db
      .collection<NewAuction>(this.AUCTIONS_COLLECTION)
      .insertMany(auctions);
  }

  findAll(): Promise<Auction[]> {
    const cursor = this.db
      .collection(this.AUCTIONS_COLLECTION)
      .find<Auction & {_id: string}>({});
    return cursor.map(transformAuction).toArray();

  }
}
