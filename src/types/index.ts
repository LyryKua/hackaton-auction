import {Context} from 'telegraf';
import {Db} from 'mongodb';
import {DbAuction} from '../db/AuctionRepository';
import {DbClient} from '../db/ClientRepository';
import {DbVolunteer} from "../db/VolunteerRepository";

export interface ClientSessionData {
  auction?: DbAuction;
  client?: DbClient;
}

export interface ClientAppContext extends Context {
  db: Db;
  session: ClientSessionData;
}

export interface VolunteerSessionData {
  volunteer?: DbVolunteer;
  activeAuction?: DbAuction;
}

export interface AppContext extends Context {
  db: Db;
  session: VolunteerSessionData;
}
