import {Auction, AuctionMongoRepository, AuctionRepository, DbAuction} from '../db/AuctionRepository';
import {Db, ObjectId} from 'mongodb';
import {PhotoMongoRepository, PhotoRepository} from '../db/PhotoRepository';
import {Telegraf} from 'telegraf';
import * as request from 'request';
import {AppContext} from "../types";

const requestImage = (url: string): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    request.get(url, {encoding: null}, (error, response, body: Buffer) => {
      if (error) {
        return reject(error);
      }
      resolve(body);
    });
  });
};

export class AuctionService {
  private readonly auctionRepository: AuctionRepository;
  private readonly photosRepository: PhotoRepository;

  constructor(private readonly db: Db, private readonly bot: Telegraf<AppContext>) {
    this.auctionRepository = new AuctionMongoRepository(db);
    this.photosRepository = new PhotoMongoRepository(db);
  }

  async create(auction: Auction): Promise<DbAuction> {
    const fileId = auction.photos[auction.photos.length - 1].file_id;
    const fileUrl = await this.bot.telegram.getFileLink(fileId);
    const image = await requestImage(fileUrl.href);
    const photoRecord = await this.photosRepository.create({
      data: image,
    });
    const newAuction = {
      ...auction,
      photoBlobId: new ObjectId(photoRecord._id.toString()),
    };
    return this.auctionRepository.create(newAuction);
  }
}
