import {
  CallSession, Dialog, IAction,
  IConversationResult, IDialogResult, IIsAction,
  IPromptOptions, IRecording, IRecordOutcome,
  IRecordPromptOptions, Library, PlayPromptAction,
  Prompts, RecordAction, RecordingCompletionReason,
  ResumeReason } from 'botbuilder-calling';

import { IPromptArgs, PromptType } from 'botbuilder-calling-speech';

export class LuisDialog extends Dialog {

  begin(session: CallSession, args: IPromptArgs): void {
    Object.assign(session.dialogData, args);
    session.send(args.action);
    session.sendBatch();
  }

  replyReceived(session: CallSession): void {
    const args: IPromptArgs = session.dialogData;
    const response = session.message as IConversationResult;
    throw new Error("Method not implemented.");
  }
}
