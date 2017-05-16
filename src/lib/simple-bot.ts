// import {
//   CallSession, IBotStorage, ICallConnector,
//   IDialogResult, IPromptChoiceResult, IPromptConfirmResult,
//   Library, MemoryBotStorage, Prompts,
//   ResumeReason, UniversalCallBot } from 'botbuilder-calling';
// // import { LuisDialog } from './dialogs/luis-dialog';
// // import { SpeechDialog } from './dialogs/speech-dialog';
// import { LuisDialog, SpeechDialog } from 'botbuilder-calling-speech';
// import { BOT_SETTINGS } from './config';
// import { BOT_SPEECH } from './services';

// export default function createBot(connector: ICallConnector, botStorage?: IBotStorage): UniversalCallBot {
//   BOT_SETTINGS.storage = new MemoryBotStorage();
//   const bot = new UniversalCallBot(connector, BOT_SETTINGS);
//   bot.on('error', console.error);
//   bot.library(BOT_SPEECH);

//   bot.dialog('/', [
//     (session, args, next) => {
//       SpeechDialog.understandSpeech(session, 'say something', {playBeep: false});
//     },
//     (session, args, next) => {
//       console.log('got speech', args);
//       session.endDialog('goodbye');
//     },
//   ]);

//   bot.dialog('foo', new LuisDialog([
//     (session, args, next) => {
//       console.log('intent', JSON.stringify(args.language, null, 2));
//       session.endDialog('intent');
//     },
//   ]).triggerAction({
//     match: 'intent.product.info',
//   }));

//   return bot;
// }
