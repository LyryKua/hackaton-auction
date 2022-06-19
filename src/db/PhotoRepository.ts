import {Db, WithId} from 'mongodb';
import {Auction} from './AuctionRepository';

const PHOTOS_COLLECTION = 'photos'

export interface PhotoBlob {
  data: Buffer;
}

export type DbPhotoBlob = WithId<PhotoBlob>

export interface PhotoRepository {
  create(auction: PhotoBlob): Promise<DbPhotoBlob>;

  getForAuction(auction: Auction): Promise<DbPhotoBlob | null>;
}

export class PhotoMongoRepository implements PhotoRepository {
  constructor(private readonly db: Db) {}

  async create(photoBlob: PhotoBlob): Promise<DbPhotoBlob> {
    const {insertedId} = await this.db.collection<PhotoBlob>(PHOTOS_COLLECTION).insertOne(photoBlob)
    return {
      ...photoBlob,
      _id: insertedId,
    }
  }

  async getForAuction(auction: Auction): Promise<DbPhotoBlob | null> {
    const {photoBlobId} = auction;
    return await this.db.collection(PHOTOS_COLLECTION).findOne<DbPhotoBlob>({
      _id: photoBlobId,
    })
  }
}
