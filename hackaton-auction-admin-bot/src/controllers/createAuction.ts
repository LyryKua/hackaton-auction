import {AppContext, AuctionRepository} from 'hackaton-auction-common';
import {Telegraf} from 'telegraf';

const fieldIds = ['title', 'description', 'photos', 'startBet'] as const;
type Field = {
  id: null | typeof fieldIds[number];
  prompt: null | string;
};

export class CreateAuctionController {
  private bot;
  private ctx;
  private repo: AuctionRepository;
  private fields: Field[] = [
    {id: 'startBet', prompt: 'Яка початкова ставка?'},
    {id: 'photos', prompt: 'Додай мінімум одне фото'},
    {id: 'description', prompt: 'Опис аукціону'},
    {id: 'title', prompt: 'Назва аукціону'},
  ];
  private currentField: Field = {
    id: null,
    prompt: null,
  };

  private auctionData = {
    title: '',
    description: '',
    photos: [],
    startBet: 0,
    volunteerId: 0,
  };
  constructor(bot: Telegraf<AppContext>, ctx: AppContext) {
    this.bot = bot;
    this.ctx = ctx;
    this.repo = new AuctionRepository(this.ctx.db);
  }
  start() {
    this.getNextField();
    this.ctx.reply(this.currentField.prompt || '');
    this.handleInput();
  }
  async finish() {
    await this.repo.create({...this.auctionData});
  }
  getNextField() {
    const nextField = this.fields.pop();
    if (nextField) {
      this.currentField = nextField;
    }
  }
  async handleInput() {
    this.bot.on('text', async ctx => {
      const userInput = ctx.message.text;
      this.auctionData.volunteerId = ctx.message.from.id;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.auctionData[this.currentField.id] = userInput;
      if (this.fields.length) {
        this.getNextField();
        ctx.reply(this.currentField.prompt || '');
      } else {
        this.finish();
      }
    });
  }
}
