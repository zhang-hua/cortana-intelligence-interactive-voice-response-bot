import {
  CallSession, Dialog, IAction,
  IConversationResult, IDialogResult, IDialogWaterfallStep,
  IIsAction, IPromptOptions, IRecording,
  IRecordOutcome, IRecordPromptOptions, Library,
  PlayPromptAction, Prompts,
  RecognizeAction, RecordAction,
  RecordingCompletionReason, ResumeReason } from 'botbuilder-calling';

import { LuisDialog } from './luis-dialog';

export class SpeechDialog extends Dialog {
  begin(session: CallSession, args: any): void {
    const prompt = PlayPromptAction.text(session, 'say something');
    const action = new RecordAction(session).playPrompt(prompt).playBeep(false).maxSilenceTimeoutInSeconds(1);
    const payload = action.toAction();
    session.send(payload).sendBatch();
  }

  replyReceived(session: CallSession): void {
    console.log('replyReceived', session.replaceDialog);
    if (!this.triggerIntent(session)) {
      if (!this.triggerCancel(session)) {
        session.endDialogWithResult({response: {foo: 'bar'}, resumed: ResumeReason.completed}); // faked
      }
    }
  }

  dialogResumed<T>(session: CallSession, result: IDialogResult<T>): void {
    console.log('resume speech', result);
    if (result.error) {
      session.error(result.error);
    } else if (result.resumed === ResumeReason.completed) {
      if (result.childId.startsWith('LUIS:')) {
        session.endDialog();
      } else if (result.childId === 'BotBuilder:Prompts') {
        session.dialogData.confirmed = result.response;
        this.replyReceived(session);
      }
    } else {
      this.replyReceived(session);
    }
  }

  private triggerCancel(session: CallSession): boolean {
    const intentDialog = LuisDialog.findCancel(session, 'foo'); // faked
    return this.trigger(session, intentDialog);
  }

  private triggerIntent(session: CallSession): boolean {
    const intentDialog = LuisDialog.findTrigger(session, 'foo'); // faked
    return this.trigger(session, intentDialog);
  }

  private trigger(session: CallSession, intentDialog: LuisDialog): boolean {
    if (intentDialog && this.canMatch(session)) {
      if (intentDialog.triggerOptions.confirmPrompt && !session.dialogData.confirmed) {
        Prompts.confirm(session, intentDialog.triggerOptions.confirmPrompt);
      } else {
        session.beginDialog(`LUIS:${intentDialog.id}`, {fake: 'data'}); // faked
      }
      return true;
    }
    return false;
  }

  private canMatch(session: CallSession): boolean {
    const confirmed = session.dialogData.confirmed;
    return confirmed === true || confirmed !== false;
  }
}
