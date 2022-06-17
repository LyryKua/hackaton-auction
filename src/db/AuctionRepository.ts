import {Db, Filter, ObjectId, WithId} from 'mongodb';
import {PhotoSize} from 'typegram';
import {RepositoryBase} from "./BaseRepository";

export interface Auction {
  id: string;
  title: string;
  description: string;
  photos: PhotoSize[];
  startBet: number;
  volunteerId: number | string;
  betIds: string[];
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

  async deleteMany(filter: Filter<Auction> = {}) {
    await this.collection().deleteMany({})
  }

  async update(id: string, betId: string) {
    // @ts-ignore
    await this.collection().updateOne({_id:  new ObjectId(id)}, { $push: {betIds: betId } })
  }
}
