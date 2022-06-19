import {Volunteer, DbVolunteer, VolunteerMongoRepository, VolunteerRepository} from '../db/VolunteerRepository';
import {Db} from 'mongodb';

export class VolunteerService {
  private readonly volunteerRepository: VolunteerRepository;

  constructor(private readonly db: Db) {
    this.volunteerRepository = new VolunteerMongoRepository(db);
  }

  async getOrCreate(volunteer: Volunteer): Promise<DbVolunteer> {
    const existingVolunteer = await this.volunteerRepository.findOne(
      volunteer.telegramId
    );
    if (existingVolunteer) {
      return existingVolunteer;
    }
    return this.volunteerRepository.create(volunteer);
  }
}
