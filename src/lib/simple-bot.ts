import {
  CallSession, IBotStorage, ICallConnector,
  IDialogResult, IPromptChoiceResult, IPromptConfirmResult,
  Library, Prompts, ResumeReason,
  UniversalCallBot } from 'botbuilder-calling';
import { LuisDialog } from './dialogs/luis-dialog';
import { SpeechDialog } from './dialogs/speech-dialog';

export default function createBot(connector: ICallConnector, botStorage?: IBotStorage): UniversalCallBot {
  const speechLib = new Library('SPEECH');
  speechLib.dialog('prompt', new SpeechDialog());
  const bot = new UniversalCallBot(connector);
  bot.library(speechLib);

  bot.dialog('/', [
    (session, args, next) => {
      console.log('get speech');
      session.beginDialog('SPEECH:prompt');
    },
    (session, args, next) => {
      console.log('got speech', args);
      session.endDialog('goodbye');
    },
  ]);

  bot.dialog('foo', new LuisDialog([
    (session, args, next) => {
      session.endDialog('intent');
    },
  ]).triggerAction({
    confirmPrompt: 'really?',
    match: 'foo',
  }));

  return bot;
}
