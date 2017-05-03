import path = require('path');
import { SearchResultDocument } from 'azure-search-client';
import {
  CallSession, IBotStorage, ICallConnector,
  IDialogResult, IPromptChoiceResult, Prompts,
  ResumeReason, UniversalCallBot } from 'botbuilder-calling';
import { IUnderstandResult, SpeechDialog } from 'botbuilder-calling-speech';
import { BotCallRecorder } from 'botbuilder-calling-test';
import { LuisResult } from "cognitive-luis-client";
import { APP, ProductSkuSelection } from './app';
import { BOT_SETTINGS } from './config';
import { BOT_LOGGER, BOT_SPEECH, BOT_STORAGE } from './services';
import { prompt, promptChoices } from './util';

interface SkuChoice {
  name: string;
  sku: string;
}
interface IProductResult extends IDialogResult<SearchResultDocument> { }
interface ISkuResult extends IDialogResult<SkuChoice> { }

export default function createBot(connector: ICallConnector, botStorage?: IBotStorage): UniversalCallBot {
  BOT_SETTINGS.storage = botStorage || BOT_STORAGE;
  const bot = new UniversalCallBot(connector, BOT_SETTINGS);
  bot.library(BOT_SPEECH);
  bot.use(new BotCallRecorder({rootDir: path.resolve(__dirname, '../../spec/data/bot/test-1')}));

  /**
   * DIALOG
   * ordering workflow
   */
  bot.dialog('/', [
    (session: CallSession, args, next) => {
      session.beginDialog('/findProduct');
    },
    (session: CallSession, args: ISkuResult, next) => {
      session.endDialog(`You are ordering ${args.response.name} ${args.response.sku}. Goodbye`);
    },
  ]);

  /**
   * DIALOG
   * query products from speech
   */
  bot.dialog('/findProduct', [
    (session: CallSession, args: any, next) => {
      SpeechDialog.understandSpeech(session, 'Hi, Please say a product name.');
    },
    (session: CallSession, args: IUnderstandResult, next) => {
      if (args.error) {
        return session.error(args.error);
      }

      /* next line causes session.dialogData to be lost */
      // session.send('Checking...').sendBatch();

      APP.findProduct(args.response.speech, args.response.language, (err, matches) => {
        if (err) {
          return session.error(err);
        }

        const speech = args.response.speech;
        const luis = args.response.language;

        session.endDialog(`You said ${speech.header.name}, with intent ${luis.topScoringIntent.intent} and ${luis.entities.length} entities`);

        session.dialogData.luis = args.response.language;

        // no matching products
        if (matches.length === 0) {
          session.send(`Sorry, I did not find any products matching "${args.response.speech.header.name}".`);
          session.replaceDialog('/findProduct');

        // multiple products
        } else if (matches.length > 1) {
          session.beginDialog('/chooseProductName', matches);

        // found the product
        } else {
          next({response: matches[0], resumed: ResumeReason.forward});
        }
      });
    },
    (session: CallSession, args: IProductResult, next) => {
      const luis: LuisResult = session.dialogData.luis;
      session.beginDialog('/chooseProductSKU', {
        entities: luis.entities,
        product: args.response.name,
        selected: {},
        skus: JSON.parse(args.response.products || '{}'),
      } as ProductSkuSelection);
    },
  ]);

  /**
   * DIALOG
   * disambiguate product name
   */
  bot.dialog('/chooseProductName', [
    (session: CallSession, args: SearchResultDocument[], next) => {
      const matches: SearchResultDocument[] = session.dialogData.matches = args;
      const choices = promptChoices(matches.map((x) => x.name), true);
      const promptText = prompt(`I found ${matches.length} matches.`, choices.prompt); // TODO or, start over
      Prompts.choice(session, promptText, choices.values);
    },

    (session: CallSession, args: IPromptChoiceResult, next) => {
      const matches: SearchResultDocument[] = session.dialogData.matches;
      const product = matches.find((x) => x.name === args.response.entity);
      session.endDialogWithResult({response: product, resumed: ResumeReason.completed} as IProductResult);
    },
  ]);

  /**
   * DIALOG
   * disambiguate product SKU
   */
  bot.dialog('/chooseProductSKU', [
    (session: CallSession, args: ProductSkuSelection, next) => {
      session.dialogData.args = args;
      const skus = APP.getSkuChoices(args);

      if (skus.length === 1) {
        const sku: SkuChoice = { name: args.product, sku: skus[0].productNumber };
        return session.endDialogWithResult({response: sku, resumed: ResumeReason.completed} as ISkuResult);
      }

      const attribute = APP.getNextSkuAttribute(skus);
      const choices = promptChoices(attribute.choices, true);
      const promptText = prompt(`What ${attribute.name}?`, choices.prompt); // TODO or, start over
      args.attribute = attribute.name;
      Prompts.choice(session, promptText, choices.values); // TODO prompting numbers is difficult to understand
    },

    (session: CallSession, choice: IPromptChoiceResult, next) => {
      const skuData: ProductSkuSelection = session.dialogData.args;
      skuData.selected[skuData.attribute] = choice.response.entity;
      session.beginDialog('/chooseProductSKU', skuData);
    },
  ]);

  return bot;
}
