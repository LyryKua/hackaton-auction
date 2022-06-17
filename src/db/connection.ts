import {Db, MongoClient} from 'mongodb';

const {DB_NAME, DB_URL} = process.env;

if (!DB_NAME) {
  throw new Error('no DB_NAME provided');
}
if (!DB_URL) {
  throw new Error('no DB_URL provided');
}

let db: Db | undefined = undefined;

export const getDb = async (): Promise<Db> => {
  if (!db) {
    const connection = await MongoClient.connect(DB_URL);
    db = connection.db(DB_NAME);
  }
  return db;
};
