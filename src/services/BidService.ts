import {Bid, BidRepository} from "../db/BidRepository";
import {Db} from "mongodb";

export class BidService {
    private readonly bidRepository: BidRepository

    constructor(private readonly db: Db) {
        this.bidRepository = new BidRepository(db)
    }

    async create(bid: Bid) {
        await this.bidRepository.create(bid)
    }

    async deleteAll() {
        await this.bidRepository.deleteMany()
    }
}