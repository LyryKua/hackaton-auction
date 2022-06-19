import {Bid, BidMongoRepository, BidRepository} from "../db/BidRepository";
import {Db} from "mongodb";

export class BidService {
    private readonly bidRepository: BidRepository

    constructor(private readonly db: Db) {
        this.bidRepository = new BidMongoRepository(db)
    }

    async create(bid: Bid) {
        await this.bidRepository.makeBid(bid)
    }
}