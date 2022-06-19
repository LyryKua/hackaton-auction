import {Binary, Db, ObjectId, WithId, WithoutId} from 'mongodb';
import {Auction} from './AuctionRepository';

const PHOTOS_COLLECTION = 'photos';

export interface PhotoBlob {
  _id: ObjectId;
  data: Buffer;
  auctionId: ObjectId;
}

export interface DbPhotoBlob extends Omit<PhotoBlob, 'data'> {
  data: Binary;
}

export interface PhotoRepository {
  create(photos: WithoutId<PhotoBlob>[]): Promise<PhotoBlob[]>;

  getForAuction(auction: WithId<Auction>): Promise<PhotoBlob[]>;
}

export class PhotoMongoRepository implements PhotoRepository {
  constructor(private readonly db: Db) {}

  async create(photoBlobs: WithoutId<PhotoBlob>[]): Promise<PhotoBlob[]> {
    const {insertedIds} = await this.db
      .collection(PHOTOS_COLLECTION)
      .insertMany(photoBlobs);

    return photoBlobs.map((photoBlob, i) => ({
      ...photoBlob,
      _id: insertedIds[i],
    }));
  }

  async getForAuction(auction: WithId<Auction>): Promise<PhotoBlob[]> {
    const photosCursor = this.db
      .collection(PHOTOS_COLLECTION)
      .find<DbPhotoBlob>({
        auctionId: auction._id,
      });
    return photosCursor
      .map(photo => ({
        ...photo,
        data: photo.data.buffer,
      }))
      .toArray();
  }
}
