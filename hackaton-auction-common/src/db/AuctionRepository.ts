import {Db, ObjectId, WithId} from 'mongodb';
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

type DBAuction = WithId<NewAuction>;

const transformAuction = ({_id, ...auction}: DBAuction): Auction => ({
  id: _id.toString(),
  ...auction,
});
export class AuctionRepository {
  private readonly AUCTIONS_COLLECTION = 'auctions';

  constructor(protected readonly db: Db) {}

  private collection<T = Auction>() {
    return this.db.collection<T>(this.AUCTIONS_COLLECTION);
  }

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
