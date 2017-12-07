import {
  CallSession, IBotStorage, ICallConnector,
  IDialogResult, IPromptChoiceResult, IPromptConfirmResult,
  Prompts, ResumeReason, UniversalCallBot } from 'botbuilder-calling';
import { configurationBotMiddleware } from './configure';
import { LOOKUP_ORDER_LIB } from './libraries/lookup-order';
import { ORDER_PRODUCT_DIALOG, ORDER_PRODUCT_LIB } from './libraries/order-product';
import { PRODUCT_INFO_LIB } from './libraries/product-info';
import { BOT_SPEECH_LIB, BOT_STORAGE } from './services';
import { BOT_SETTINGS } from './settings';

export default function createBot(connector: ICallConnector, botStorage?: IBotStorage): UniversalCallBot {
  BOT_SETTINGS.storage = botStorage || BOT_STORAGE;
  console.info(BOT_SETTINGS.promptDefaults);
  BOT_SETTINGS.promptDefaults = {
    culture: 'zh-CN',
    voice: 'male',
  }
  const bot = new UniversalCallBot(connector, BOT_SETTINGS);
  bot.on('error', console.error);
  bot.library(BOT_SPEECH_LIB);
  bot.library(ORDER_PRODUCT_LIB);
  bot.library(PRODUCT_INFO_LIB);
  bot.library(LOOKUP_ORDER_LIB);
  bot.dialog('/', (session, args, next) => session.beginDialog(ORDER_PRODUCT_DIALOG));
  bot.use(configurationBotMiddleware);

  // bot.use(BOT_LOGGER.callingMiddleware);
  // bot.use(new BotCallRecorder({rootDir: path.resolve(__dirname, '../../spec/data/bot/test-1')}).middleware);

  return bot;
}
