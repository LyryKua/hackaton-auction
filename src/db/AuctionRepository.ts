import {Db, Filter, ObjectId, WithId} from 'mongodb';
import {PhotoSize} from 'typegram';

export const AUCTIONS_COLLECTION = 'auctions';

export type Auction = {
  title: string;
  description: string;
  photos: PhotoSize[];
  photoBlobId?: ObjectId;
  startBid: number;
  volunteerId: string;
  status: 'opened' | 'closed';
};

export type DbAuction = WithId<Auction>;

export interface AuctionRepository {
  create(auction: Auction): Promise<DbAuction>;

  close(id: string, volunteerId: string): Promise<void>;

  deleteMany(filter: Filter<DbAuction>): Promise<void>;

  findAll(): Promise<DbAuction[]>;

  findOne(id: string): Promise<DbAuction | null>;

  findActive(volunteerId: string): Promise<DbAuction | null>;
}

export class AuctionMongoRepository implements AuctionRepository {
  constructor(private readonly db: Db) {}

  async create(auction: Auction): Promise<DbAuction> {
    const {insertedId} = await this.db.collection<Auction>(AUCTIONS_COLLECTION).insertOne(auction)
    return {
      ...auction,
      _id: insertedId,
    }
  }

  async close(auctionId: string, volunteerId: string) {
    await this.db.collection(AUCTIONS_COLLECTION).updateOne(
        {
          volunteerId,
          _id: new ObjectId(auctionId),
        },
        {
          status: 'closed',
        }
    );
  }

  async deleteMany(filter: Filter<Auction> = {}) {
    await this.db.collection(AUCTIONS_COLLECTION).deleteMany(filter);
  }

  findAll(): Promise<DbAuction[]> {
    const cursor = this.db.collection<Auction>(AUCTIONS_COLLECTION).find<DbAuction>({});
    return cursor.toArray();
  }

  findOne(id: string): Promise<DbAuction | null> {
    return this.db.collection<Auction>(AUCTIONS_COLLECTION).findOne<DbAuction>({
      _id: new ObjectId(id),
    });
  }

  findActive(volunteerId: string): Promise<DbAuction | null> {
    return this.db.collection<DbAuction>(AUCTIONS_COLLECTION).findOne<DbAuction>({
      volunteerId,
      status: 'opened',
    });
  }
}
