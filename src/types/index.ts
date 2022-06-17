import {Context} from 'telegraf';
import {Db} from 'mongodb';
import {Auction} from '../db/AuctionRepository';
import {Client} from '../db/Client';
import {Volunteer} from '../db/Volunteer';

export interface ClientSessionData {
  auction?: Auction;
  client?: Client;
}

export interface ClientAppContext extends Context {
  db: Db;
  session: ClientSessionData;
}

export interface VolunteerSessionData {
  volunteer?: Volunteer;
  activeAuction?: Auction;
}

export interface AppContext extends Context {
  db: Db;
  session: VolunteerSessionData;
}
