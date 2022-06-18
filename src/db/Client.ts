import {RepositoryBase, WithoutId} from './BaseRepository';
import {ObjectId, WithId} from 'mongodb';

export interface Client {
  id: string;
  telegramId: number;
  username?: string;
  chatId: number;
}

type DbClient = WithId<Omit<Client, 'id'>>;

export class ClientRepository extends RepositoryBase<Client> {
  collectionName = 'clients';

  async register(clientData: WithoutId<Client>): Promise<Client> {
    const {telegramId, username, chatId} = clientData;
    const client = await this.findClient(telegramId);
    if (client) {
      return client;
    }
    const newClient = await this.collection<WithoutId<Client>>().insertOne({
      telegramId,
      chatId,
      username,
    });
    return {
      ...clientData,
      id: newClient.insertedId.toString(),
    };
  }

  async findClient(telegramId: number): Promise<Client | undefined> {
    const dbClient = await this.collection<DbClient>().findOne({
      telegramId,
    });
    if (!dbClient) {
      return undefined;
    }
    const {_id, ...dbClientData} = dbClient;
    return {
      id: _id.toString(),
      ...dbClientData,
    };
  }

  async findById(clientId: string): Promise<Client | null> {
    return this.collection().findOne({
      _id: new ObjectId(clientId),
    });
  }

  findByAuctionId(auctionIds: string[]): Promise<Client[] | null> {
    const cursor = this.collection().find({});
    return cursor.toArray()
  }

  async findClientByUsername(username: string) {
    return this.collection().findOne({username});
  }
}
