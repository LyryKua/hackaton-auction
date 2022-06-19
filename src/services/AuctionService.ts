import {Auction, AuctionMongoRepository, AuctionRepository, DbAuction,} from '../db/AuctionRepository';
import {Db} from 'mongodb';
import {PhotoMongoRepository, PhotoRepository} from '../db/PhotoRepository';
import {Telegraf} from 'telegraf';
import * as request from 'request';
import {AppContext} from '../types';

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

  constructor(
    private readonly db: Db,
    private readonly bot: Telegraf<AppContext>
  ) {
    this.auctionRepository = new AuctionMongoRepository(db);
    this.photosRepository = new PhotoMongoRepository(db);
  }

  async create(rawAuction: Auction): Promise<DbAuction> {
    const fileIds = Array.from(
      new Set(rawAuction.photos.map(photo => photo.file_id))
    );
    const fileUrls = await Promise.all(
      fileIds.map(fileId => this.bot.telegram.getFileLink(fileId))
    );
    const images = await Promise.all(
      fileUrls.map(fileUrl => requestImage(fileUrl.href))
    );
    const newAuction = await this.auctionRepository.create(rawAuction);
    const auctionId = newAuction._id;
    await this.photosRepository.create(
      images.map(image => ({
        data: image,
        auctionId: auctionId,
      }))
    );
    return newAuction;
  }
}
