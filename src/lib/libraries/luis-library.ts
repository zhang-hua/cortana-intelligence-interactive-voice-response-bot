import {
  CallSession, Dialog, IAction,
  IConversationResult, IDialogResult, IIsAction,
  IPromptOptions, IRecording, IRecordOutcome,
  IRecordPromptOptions, Library, PlayPromptAction,
  Prompts, RecordAction, RecordingCompletionReason,
  ResumeReason } from 'botbuilder-calling';

export const LUIS_LIBRARY_NAME = 'Speech';
export const LUIS_DIALOG_NAME = `${LUIS_LIBRARY_NAME}:Prompts`;

export function createLuisLibrary(routes: any): Library {
  const lib = new Library(LUIS_LIBRARY_NAME);
  return lib;
}
