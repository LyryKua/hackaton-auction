import {RepositoryBase, WithoutId} from './BaseRepository';

export interface Volunteer {
  id: string;
  telegramId: number;
  username?: string;
  chatId: number;
}

export class VolunteerRepository extends RepositoryBase<Volunteer> {
  collectionName = 'volunteer';

  async register(clientData: WithoutId<Volunteer>): Promise<Volunteer> {
    const {telegramId, username, chatId} = clientData;
    const volunteer = await this.findVolunteer(telegramId);
    if (volunteer) {
      return volunteer;
    }
    const newVolunteer = await this.collection<
      WithoutId<Volunteer>
    >().insertOne({
      telegramId,
      chatId,
      username,
    });
    return {
      ...clientData,
      id: newVolunteer.insertedId.toString(),
    };
  }

  async findVolunteer(telegramId: number) {
    return this.collection().findOne({
      telegramId,
    });
  }

  async findVolunteerByUsername(username: string) {
    return this.collection().findOne({username});
  }
}
