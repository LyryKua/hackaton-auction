import {RepositoryBase, WithoutId} from './BaseRepository';
import {ObjectId} from "mongodb";

export interface Client {
  id: string;
  telegramId: number;
  username?: string;
  chatId: number;
}

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

  async findClient(telegramId: number) {
    return this.collection().findOne({
      telegramId,
    });
  }

  async findById(userId: string): Promise<Client | null> {
    return this.collection().findOne({
      _id: new ObjectId(userId),
    });
  }

  async findClientByUsername(username: string) {
    return this.collection().findOne({username});
  }
}
