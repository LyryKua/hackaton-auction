import {Auction, AuctionRepository, NewAuction} from "../db/AuctionRepository";
import {Db} from "mongodb";

export class AuctionService {
    private readonly auctionRepository: AuctionRepository

    constructor(private readonly db: Db) {
        this.auctionRepository = new AuctionRepository(db)
    }

    async create(auction: NewAuction): Promise<Auction> {
        return this.auctionRepository.create(auction)
    }

    async deleteAll() {
        await this.auctionRepository.deleteMany()
    }
}