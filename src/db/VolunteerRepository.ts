import {Db, Filter, WithId} from 'mongodb';
import {RepositoryBase, WithoutId} from './BaseRepository';

export const VOLUNTEERS_COLLECTION = 'volunteers';

export type Volunteer = {
  id: string;
  telegramId: number;
  chatId: number;
  username?: string;
};

export class VolunteerRepository extends RepositoryBase<Volunteer> {
  constructor(db: Db) {
    super(VOLUNTEERS_COLLECTION, db);
  }

  async findOne(telegramId: number): Promise<Volunteer | undefined> {
    const dbVolunteer = await this.collection<
      WithId<WithoutId<Volunteer>>
    >().findOne({
      telegramId,
    });
    if (!dbVolunteer) {
      return undefined;
    }
    const {_id, ...dbVolunteerData} = dbVolunteer;
    return {
      id: _id.toString(),
      ...dbVolunteerData,
    };
  }

  async deleteMany(filter: Filter<Volunteer> = {}) {
    await this.db.collection(VOLUNTEERS_COLLECTION).deleteMany(filter);
  }
}
