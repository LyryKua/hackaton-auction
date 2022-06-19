import {Volunteer, VolunteerRepository} from '../db/VolunteerRepository';
import {Db} from 'mongodb';
import {WithoutId} from '../db/BaseRepository';

export class VolunteerService {
  private readonly volunteerRepository: VolunteerRepository;

  constructor(private readonly db: Db) {
    this.volunteerRepository = new VolunteerRepository(db);
  }

  async getOrCreate(volunteer: WithoutId<Volunteer>): Promise<Volunteer> {
    const existingVolunteer = await this.volunteerRepository.findOne(
      volunteer.telegramId
    );
    if (existingVolunteer) {
      return existingVolunteer;
    }
    return this.volunteerRepository.create(volunteer);
  }
}
