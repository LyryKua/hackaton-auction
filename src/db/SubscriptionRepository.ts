import {UpdateResult, WithId, ObjectId, ModifyResult} from 'mongodb';
import {RepositoryBase, WithoutId} from './BaseRepository';
import {randomUUID} from 'crypto';

export const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

export type Subscription = {
  id: string;
  auctionId: string;
  clientId: string;
  type: string;
};

type DbSubscription = WithId<Subscription>;

export class SubscriptionRepository extends RepositoryBase<Subscription> {
  collectionName = SUBSCRIPTIONS_COLLECTION;

  async subscribe(
    subscriptionData: WithoutId<Subscription>
  ): Promise<Subscription> {
    const newSubscription = await this.collection<
      Omit<DbSubscription, '_id'>
    >().insertOne({
      id: randomUUID(),
      type: subscriptionData.type,
      auctionId: subscriptionData.auctionId,
      clientId: subscriptionData.clientId,
    });
    return {
      ...subscriptionData,
      id: newSubscription.insertedId.toString(),
    };
  }

  async unsubscribe(
    subscriptionData: WithoutId<Partial<Subscription>>
  ): Promise<ModifyResult<Omit<DbSubscription, '_id'>>> {
    return await this.collection<
      Omit<DbSubscription, '_id'>
    >().findOneAndUpdate(
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
  ): Promise<{result: boolean}> {
    const auction = await this.collection<Subscription>().findOne({
      clientId,
      auctionId,
      type: 'active',
    });
    return {
      result: !!auction,
    };
  }

  async findSubscribers(auctionId: string): Promise<Subscription[]> {
    const cursor = this.collection().find<DbSubscription>({
      auctionId,
    });
    const t = await cursor.toArray();
    return t;
  }
}
