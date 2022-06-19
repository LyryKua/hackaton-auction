import {Binary, Db, ObjectId, WithId, WithoutId} from 'mongodb';
import {Auction} from './AuctionRepository';

const PHOTOS_COLLECTION = 'photos';

export interface PhotoBlob {
  _id: ObjectId;
  data: Buffer;
}

export interface DbPhotoBlob {
  _id: ObjectId;
  data: Binary;
}

export interface PhotoRepository {
  create(auction: WithoutId<PhotoBlob>): Promise<PhotoBlob>;

  getForAuction(auction: Auction): Promise<PhotoBlob | undefined>;
}

export class PhotoMongoRepository implements PhotoRepository {
  constructor(private readonly db: Db) {}

  async create(photoBlob: WithoutId<PhotoBlob>): Promise<PhotoBlob> {
    const {insertedId} = await this.db
      .collection(PHOTOS_COLLECTION)
      .insertOne(photoBlob);
    return {
      ...photoBlob,
      _id: insertedId,
    };
  }

  async getForAuction(auction: Auction): Promise<PhotoBlob | undefined> {
    const {photoBlobId} = auction;
    const photo = await this.db
      .collection(PHOTOS_COLLECTION)
      .findOne<DbPhotoBlob>({
        _id: photoBlobId,
      });
    if (!photo) {
      return undefined;
    }
    return {
      ...photo,
      data: photo.data.buffer,
    };
  }
}
