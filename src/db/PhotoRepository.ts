import {RepositoryBase} from './BaseRepository';
import {Binary, Db, ObjectId} from 'mongodb';
import {Auction} from './AuctionRepository';

export interface PhotoBlob {
  id: string;
  data: Buffer;
}

interface DbPhotoBlob {
  _id: ObjectId;
  data: Binary;
}

export class PhotoRepository extends RepositoryBase<PhotoBlob> {
  constructor(db: Db) {
    super('photos', db);
  }

  async getForAuction(auction: Auction): Promise<PhotoBlob | undefined> {
    const {photoBlobId} = auction;
    const photo = await this.collection().findOne<DbPhotoBlob>({
      _id: photoBlobId,
    });
    if (!photo) {
      return undefined;
    }
    return {id: photo._id.toString(), data: photo.data.buffer};
  }
}
