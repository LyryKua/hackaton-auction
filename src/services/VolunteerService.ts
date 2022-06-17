import {Volunteer, VolunteerRepository} from "../db/VolunteerRepository";
import {Db} from "mongodb";

export class VolunteerService {
    private readonly volunteerRepository: VolunteerRepository

    constructor(private readonly db: Db) {
        this.volunteerRepository = new VolunteerRepository(db)
    }

    async create(volunteer: Volunteer) {
        return await this.volunteerRepository.create(volunteer)
    }
}