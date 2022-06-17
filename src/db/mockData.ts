import {NewAuction} from './AuctionRepository';

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
    startBet: 1000,
    betIds: [],
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
    startBet: 800,
    betIds: [],
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
