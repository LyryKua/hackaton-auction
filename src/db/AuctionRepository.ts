import {Db, Filter, ObjectId, WithId} from 'mongodb';
import {PhotoSize} from 'typegram';
import {RepositoryBase} from './BaseRepository';

export interface Auction {
  id: string;
  title: string;
  description: string;
  photos: PhotoSize[];
  startBet: number;
  volunteerId: string;
  betIds: string[];
  status: 'opened' | 'closed';
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

const transformAuction = ({_id, status, ...auction}: DBAuction): Auction => ({
  id: _id.toString(),
  ...auction,
  status: status || 'opened',
});

export class AuctionRepository extends RepositoryBase<Auction> {
  readonly collectionName: string = 'auctions';

  async create(auction: NewAuction): Promise<Auction> {
    const {insertedId} = await this.collection<NewAuction>().insertOne(auction);
    return {
      ...auction,
      id: insertedId.toString(),
      status: 'opened',
    };
  }

  async close(auctionId: string, volunteerId: string) {
    await this.collection().updateOne(
      {
        volunteerId,
        _id: new ObjectId(auctionId),
      },
      {
        status: 'closed',
      }
    );
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

  async findActive(volunteerId: string): Promise<Auction | null> {
    const auction = await this.collection<Auction>().findOne({
      volunteerId,
      status: 'opened',
    });
    if (!auction) {
      return null;
    }
    return transformAuction(auction);
  }

  async deleteMany(filter: Filter<Auction> = {}) {
    await this.collection().deleteMany({});
  }

  async update(id: string, betId: string) {
    // @ts-ignore
    await this.collection().updateOne(
      {_id: new ObjectId(id)},
      {$push: {betIds: betId}}
    );
  }
}
