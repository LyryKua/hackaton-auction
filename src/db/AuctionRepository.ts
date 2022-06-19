import {Db, Filter, ObjectId, WithId} from 'mongodb';
import {PhotoSize} from 'typegram';
import {RepositoryBase} from './BaseRepository';

export const AUCTIONS_COLLECTION = 'auctions';

export type Auction = {
  id: string;
  title: string;
  description: string;
  photos: PhotoSize[];
  startBid: number;
  volunteerId: string;
  status: 'opened' | 'closed';
};

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
  constructor(db: Db) {
    super(AUCTIONS_COLLECTION, db);
  }

  async close(auctionId: string, volunteerId: string) {
    await this.collection().updateOne(
      {
        volunteerId,
        _id: new ObjectId(auctionId),
      },
      {
        $set: {
          status: 'closed',
        },
      }
    );
  }

  async deleteMany(filter: Filter<Auction> = {}) {
    await this.db.collection(AUCTIONS_COLLECTION).deleteMany(filter);
  }

  findAll(): Promise<Auction[]> {
    const cursor = this.db
      .collection<Auction>(AUCTIONS_COLLECTION)
      .find<DBAuction>({});
    return cursor.map(transformAuction).toArray();
  }

  async findOne(auctionId: string): Promise<Auction | null> {
    const auction = await this.db
      .collection<Auction>(AUCTIONS_COLLECTION)
      .findOne({
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

  async update(id: string, betId: string) {
    // @ts-ignore
    await this.collection().updateOne(
      {_id: new ObjectId(id)},
      {$push: {betIds: betId}}
    );
  }
}
