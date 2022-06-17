// @ts-nocheck
import {Telegraf} from 'telegraf';
import {AuctionRepository} from '../db/AuctionRepository';
import {AppContext} from '../types';

const fieldIds = ['title', 'description', 'photos', 'startBet'] as const;
type Field = {
  id: typeof fieldIds[number];
  prompt: null | string;
};

export class CreateAuctionController {
  private bot;
  private ctx;
  private repo: AuctionRepository;
  private currentFieldPointer: number | null;
  private fields: Field[] = [
    {id: 'title', prompt: 'Назва аукціону'},
    {id: 'description', prompt: 'Опис аукціону'},
    {id: 'photos', prompt: 'Додай мінімум одне фото'},
    {id: 'startBet', prompt: 'Яка початкова ставка?'},
  ];

  private auctionData = {
    title: '',
    description: '',
    photos: [],
    startBet: 0,
    volunteerId: 0,
    betIds: [],
  };
  constructor(bot: Telegraf<AppContext>, ctx: AppContext) {
    this.bot = bot;
    this.ctx = ctx;
    this.repo = new AuctionRepository(this.ctx.db);
    this.currentFieldPointer = null;
    this.auctionData.volunteerId = ctx.update.message.from.id;
  }
  getPrompt() {
    return this.fields[this.currentFieldPointer].prompt;
  }
  getFieldId() {
    return this.fields[this.currentFieldPointer].id;
  }
  start() {
    this.currentFieldPointer = 0;
    this.ctx.reply(this.getPrompt());
    this.setInputHandlers();
  }
  async finish(ctx) {
    await this.repo.create({
      ...this.auctionData,
      volunteerId: ctx.message.from.id,
    });
    this.ctx.reply(`Result: ${JSON.stringify(this.auctionData)}`);
    this.currentFieldPointer = null;
    this.ctx.scene.leave();
  }
  isLastFiled() {
    return this.currentFieldPointer === this.fields.length - 1;
  }
  async nextField(ctx) {
    if (this.isLastFiled()) {
      await this.finish(ctx);
    } else {
      this.currentFieldPointer++;
    }
  }
  setInputHandlers() {
    this.bot.on('text', async ctx => {
      if (this.currentFieldPointer !== null) {
        const userInput = ctx.message.text;
        if (this.fields[this.currentFieldPointer]) {
          // @ts-ignore
          this.auctionData[this.getFieldId()] = userInput;
          await this.nextField(ctx);
          if (this.fields[this.currentFieldPointer]) {
            ctx.reply(this.getPrompt());
          }
        }
      }
    });
  }
}
