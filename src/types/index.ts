import {Context} from 'telegraf';
import {Db} from 'mongodb';
import {Auction} from '../db/AuctionRepository';
import {Client} from '../db/Client';
import {Volunteer} from "../db/VolunteerRepository";

export interface ClientSessionData {
  auction?: Auction;
  client?: Client;
}

export interface ClientAppContext extends Context {
  db: Db;
  session: ClientSessionData;
}

export interface VolunteerSessionData {
  volunteer?: Partial<Volunteer>;
  activeAuction?: Auction;
}

export interface AppContext extends Context {
  db: Db;
  session: VolunteerSessionData;
}
