import { randomUUID } from 'crypto'
import type { Db } from 'mongodb'

type Auction = {
    id: string
    title: string
}

export class AuctionRepository {
    private readonly AUCTIONS_COLLECTION = 'auctions'

    constructor(protected readonly db: Db) {}

    async create(auction: Omit<Auction, 'id'>): Promise<void> {
        const id = randomUUID()
        await this.db.collection(this.AUCTIONS_COLLECTION).insertOne({
            id,
            title: auction.title,
        })
    }

    findAll(): Promise<Auction[]> {
        let cursor = this.db
            .collection(this.AUCTIONS_COLLECTION)
            .find<Auction>({})

        return cursor.toArray()
    }
}
