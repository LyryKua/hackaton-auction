import {Db} from 'mongodb';

export type WithoutId<T extends {id?: string}> = Omit<T, 'id' | '_id'>;

export class RepositoryBase<Model extends {id: string}> {
  constructor(
    protected readonly collectionName: string,
    protected readonly db: Db
  ) {}

  protected collection<T = Model>() {
    return this.db.collection<T>(this.collectionName);
  }

  async create<T extends Model = Model>(
    entity: WithoutId<T>
  ): Promise<WithoutId<T> & {id: string}> {
    const createdAndUpdatedDate = new Date();
    const doc = {
      ...entity,
      createdAt: createdAndUpdatedDate,
      updatedAt: createdAndUpdatedDate,
    };

    const {insertedId} = await this.db
      .collection(this.collectionName)
      .insertOne(doc);
    return {
      id: insertedId.toString(),
      ...doc,
    };
  }
}
