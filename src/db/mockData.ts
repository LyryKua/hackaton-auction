import {Auction, NewAuction} from './AuctionRepository';
import {Bid} from './BidRepository'; // TODO: rename to bet
import {randomUUID} from "crypto";
import {ObjectId} from "mongodb";

type Mocker<T> = (overrides?: Partial<T>) => T

export const arrayOf = <T>(length: number, factory: (index: number) => T): T[] =>
    Array(length)
        .fill(undefined)
        .map((_, index) => factory(index))

export const mockAuction: Mocker<Auction> = overrides => ({
  id: randomUUID(),
  title: 'foo title',
  description: 'bar description zaz',
  photoBlobId: new ObjectId('asdf'),
  photos: [],
  startBid: 10,
  volunteerId: randomUUID(),
  status: "opened",
  ...overrides,
})

export const mockBid: Mocker<Bid> = overrides => ({
  id: randomUUID(),
  auctionId: randomUUID(),
  clientId: randomUUID(),
  amount: 42,
  ...overrides,
})

export const mockAuctions = (volunteerId: string): NewAuction[] => [
  {
    title: 'Перший аукціон',
    status: 'opened',
    photos: [
      {
        file_id:
          'AgACAgIAAxkBAAMfYqslt567Db5L6qnn0a7RjFM9OnYAAlq8MRvH22FJgbWozqFukfgBAAMCAANzAAMkBA',
        file_unique_id: 'AQADWrwxG8fbYUl4',
        file_size: 1373,
        width: 75,
        height: 90,
      },
      {
        file_id:
          'AgACAgIAAxkBAAMfYqslt567Db5L6qnn0a7RjFM9OnYAAlq8MRvH22FJgbWozqFukfgBAAMCAANtAAMkBA',
        file_unique_id: 'AQADWrwxG8fbYUly',
        file_size: 11201,
        width: 265,
        height: 320,
      },
      {
        file_id:
          'AgACAgIAAxkBAAMfYqslt567Db5L6qnn0a7RjFM9OnYAAlq8MRvH22FJgbWozqFukfgBAAMCAAN4AAMkBA',
        file_unique_id: 'AQADWrwxG8fbYUl9',
        file_size: 30854,
        width: 650,
        height: 786,
      },
    ],
    description:
      'Всім привіт! Кому оці марки "русскій корабль всьо"? Гроші підуть куди треба!',
    volunteerId,
    startBid: 1000,
  },
  {
    title: 'Другий аукціон',
    status: 'closed',
    photos: [
      {
        file_id:
          'AgACAgIAAxkBAAMfYqslt567Db5L6qnn0a7RjFM9OnYAAlq8MRvH22FJgbWozqFukfgBAAMCAANzAAMkBA',
        file_unique_id: 'AQADWrwxG8fbYUl4',
        file_size: 1373,
        width: 75,
        height: 90,
      },
      {
        file_id:
          'AgACAgIAAxkBAAMfYqslt567Db5L6qnn0a7RjFM9OnYAAlq8MRvH22FJgbWozqFukfgBAAMCAANtAAMkBA',
        file_unique_id: 'AQADWrwxG8fbYUly',
        file_size: 11201,
        width: 265,
        height: 320,
      },
      {
        file_id:
          'AgACAgIAAxkBAAMfYqslt567Db5L6qnn0a7RjFM9OnYAAlq8MRvH22FJgbWozqFukfgBAAMCAAN4AAMkBA',
        file_unique_id: 'AQADWrwxG8fbYUl9',
        file_size: 30854,
        width: 650,
        height: 786,
      },
    ],
    description: 'Добридень! Коротше, прийшла оця залупа дивіться, налітай!',
    volunteerId,
    startBid: 800,
  },
];

export const mockBets = (auctionId: string, clientId: string): any[] => [
  {
    auctionId,
    clientId,
    amount: 1255,
  },
  {
    auctionId,
    clientId,
    amount: 1200,
  },
];
