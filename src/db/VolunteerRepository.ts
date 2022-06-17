import {Db, Filter} from 'mongodb';
import {RepositoryBase} from './BaseRepository';

export const VOLUNTEERS_COLLECTION = 'volunteers'

export type Volunteer = {
    id: string;
    telegramId: number;
}

export class VolunteerRepository extends RepositoryBase<Volunteer> {
    constructor(db: Db) {
        super(VOLUNTEERS_COLLECTION, db);
    }

    async deleteMany(filter: Filter<Volunteer> = {}) {
        await this.db.collection(VOLUNTEERS_COLLECTION).deleteMany(filter)
    }
}
