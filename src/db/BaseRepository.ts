import {Db} from 'mongodb';

export type WithoutId<T extends {id: string}> = Omit<T, 'id'>;

export class RepositoryBase<Model> {
  constructor(protected readonly collectionName: string, protected readonly db: Db) {}

  protected collection<T = Model>() {
    return this.db.collection<T>(this.collectionName);
  }

  async create<T>(entity: T) {
    const createdAndUpdatedDate = new Date()
    await this.db.collection(this.collectionName).insertOne({
      ...entity,
      createdAt: createdAndUpdatedDate,
      updatedAt: createdAndUpdatedDate,
    })
  }
}
