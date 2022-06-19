import {Db, ObjectId, WithId} from 'mongodb';

const CLIENTS_COLLECTION = 'clients';

export type Client = {
  telegramId: number;
  chatId: number;
  username?: string;
}

export type DbClient = WithId<Client>;

export interface ClientRepository {
  register(clientData: Client): Promise<DbClient>; // TODO: rename to `create`

  findClient(telegramId: number): Promise<DbClient | null>;

  findById(id: string): Promise<DbClient | null>;

  findClientByUsername(username: string): Promise<DbClient | null>;

  findUsers(userIds: string[]): Promise<Record<string, DbClient>>; // TODO: this method should be in service
}

export class ClientMongoRepository implements ClientRepository {
  constructor(private readonly db: Db) {}

  async register(clientData: Client): Promise<DbClient> {
    const {telegramId, username, chatId} = clientData;
    const client = await this.findClient(telegramId);
    if (client) {
      return client;
    }
    const { insertedId } = await this.db.collection<Client>(CLIENTS_COLLECTION).insertOne({
      telegramId,
      chatId,
      username,
    });
    return {
      ...clientData,
      _id: insertedId,
    };
  }

  findClient(telegramId: number): Promise<DbClient | null> {
    return this.db.collection<Client>(CLIENTS_COLLECTION).findOne({
      telegramId,
    })
  }

  findById(id: string): Promise<DbClient | null> {
    return this.db.collection<Client>(CLIENTS_COLLECTION).findOne({
      _id: new ObjectId(id),
    });
  }

  findClientByUsername(username: string) {
    return this.db.collection<Client>(CLIENTS_COLLECTION).findOne({username});
  }

  async findUsers(userIds: string[]): Promise<Record<string, DbClient>> {
    const users = await this.db.collection<Client>(CLIENTS_COLLECTION).find({
      _id: {$in: userIds.map(userId => new ObjectId(userId))},
    });
    const usernames: Record<string, DbClient> = {};
    await users.forEach(user => {
      usernames[user._id.toString()] = user;
    });
    return usernames;
  }
}
