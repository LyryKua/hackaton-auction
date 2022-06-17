import {Context} from 'telegraf';
import {Db} from 'mongodb';
import {Auction} from '../db/AuctionRepository';
import {Client} from '../db/Client';

export interface ClientSessionData {
  auction?: Auction;
  client?: Client;
}

export interface ClientAppContext extends Context {
  db: Db;
  session: ClientSessionData;
}


export interface AppContext extends Context {
  db: Db;
}
