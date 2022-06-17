import {Db} from 'mongodb';

export {WithId as WithMongoId} from 'mongodb';
export {WithoutId as WithoutMongoId} from 'mongodb';
export type WithoutId<T extends {id: string}> = Omit<T, 'id'>;

export abstract class RepositoryBase<Model> {
  abstract collectionName: string;
  constructor(protected readonly db: Db) {}

  protected collection<T = Model>() {
    return this.db.collection<T>(this.collectionName);
  }
}
