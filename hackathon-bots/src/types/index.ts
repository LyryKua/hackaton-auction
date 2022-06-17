import {Context} from 'telegraf';
import {Db} from 'mongodb';
import {Auction} from '../db/AuctionRepository';
export interface SessionData {
  auction?: Auction;
}

export interface AppContext extends Context {
  db: Db;
  session: SessionData;
}