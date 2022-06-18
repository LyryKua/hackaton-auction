import {Auction, AuctionRepository} from '../db/AuctionRepository';
import {BidRepository} from '../db/BidRepository';

const invalidMessages = {
  notEnoughAmount: (limit: number) =>
    `Ваша ставка замала, будь ласка зробіть ставку більше ніж ${limit}`,
  empty: (limit?: number) =>
    `Будьласочка, введіть суму цифрами в форматі /make_bid ${limit || '1000'}`,
};

export const validateByExists = (bidAmountStr: string): string | null => {
  return String(Number(bidAmountStr)) !== bidAmountStr
    ? invalidMessages.empty()
    : null;
};

export const isValidByAmount = async (
  bidRepository: BidRepository,
  auction: Auction,
  bidAmount: number
): Promise<string | null> => {
  if (auction.startBid > bidAmount) {
    return invalidMessages.notEnoughAmount(auction.startBid);
  }

  const highestBid = await bidRepository.findHighest(auction.id);

  if (!highestBid) {
    return null;
  }

  return bidAmount <= highestBid.amount
    ? invalidMessages.notEnoughAmount(highestBid.amount)
    : null;
};
