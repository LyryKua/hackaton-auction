import {Db, ModifyResult, WithId} from 'mongodb';

export const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

export type Subscription = {
  auctionId: string;
  clientId: string;
  type?: string;
};

type DbSubscription = WithId<Subscription>;

export interface SubscriptionRepository {
  subscribe(subscriptionData: Subscription): Promise<DbSubscription>; // TODO: should be named as `create`. `subscribe` method should move to service

  unsubscribe(subscriptionData: Subscription): Promise<ModifyResult<Omit<DbSubscription, '_id'>>>;

  isClientSubscribed(auctionId: string, clientId: string): Promise<{ result: boolean }>;

  findSubscribers(auctionId: string): Promise<Subscription[]>;
}

export class SubscriptionMongoRepository implements SubscriptionRepository {
  constructor(private readonly db: Db) {}

  async subscribe(subscriptionData: Subscription): Promise<DbSubscription> {
    const {insertedId} = await this.db.collection<Subscription>(SUBSCRIPTIONS_COLLECTION).insertOne({
      type: subscriptionData.type,
      auctionId: subscriptionData.auctionId,
      clientId: subscriptionData.clientId,
    });

    return {
      ...subscriptionData,
      _id: insertedId,
    };
  }

  unsubscribe(subscriptionData: Subscription): Promise<ModifyResult<Omit<DbSubscription, '_id'>>> {
    return this.db.collection<Subscription>(SUBSCRIPTIONS_COLLECTION).findOneAndUpdate(
        {
          clientId: subscriptionData.clientId,
          auctionId: subscriptionData.auctionId,
        },
        {
          $set: {
            type: 'cancelled',
          },
        }
    );
  }

  async isClientSubscribed(
      auctionId: string,
      clientId: string
  ): Promise<{ result: boolean }> {
    const auction = await this.db.collection<Subscription>(SUBSCRIPTIONS_COLLECTION).findOne({
      clientId,
      auctionId,
      type: 'active',
    });
    return {
      result: !!auction,
    };
  }

  async findSubscribers(auctionId: string): Promise<Subscription[]> {
    const cursor = this.db.collection(SUBSCRIPTIONS_COLLECTION).find<DbSubscription>({
      auctionId,
    });
    const t = await cursor.toArray();
    return t;
  }
}
