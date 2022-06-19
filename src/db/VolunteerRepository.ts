import {Db, WithId} from 'mongodb';

export const VOLUNTEERS_COLLECTION = 'volunteers'

export type Volunteer = {
    telegramId: number;
    chatId: number;
    username?: string;
}

export type DbVolunteer = WithId<Volunteer>;

export interface VolunteerRepository {
    create(volunteer: Volunteer): Promise<DbVolunteer>;

    findOne(telegramId: number): Promise<DbVolunteer | null>;
}

export class VolunteerMongoRepository implements VolunteerRepository {
    constructor(private readonly db: Db) {}

    async create(volunteer: Volunteer): Promise<DbVolunteer> {
        const {insertedId} = await this.db.collection(VOLUNTEERS_COLLECTION).insertOne(volunteer);

        return {
            ...volunteer,
            _id: insertedId,
        };
    }

    async findOne(telegramId: number): Promise<DbVolunteer | null> {
        return  this.db.collection<Volunteer>(VOLUNTEERS_COLLECTION).findOne({
            telegramId,
        });
    }
}
