"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_calling_1 = require("botbuilder-calling");
const cognitive_speech_client_1 = require("cognitive-speech-client");
const recognize_speech_action_1 = require("../workflow/recognize-speech-action");
const understand_speech_action_1 = require("../workflow/understand-speech-action");
const luis_dialog_1 = require("./luis-dialog");
var PromptType;
(function (PromptType) {
    PromptType[PromptType["action"] = 0] = "action";
    PromptType[PromptType["confirm"] = 1] = "confirm";
    PromptType[PromptType["choice"] = 2] = "choice";
    PromptType[PromptType["digits"] = 3] = "digits";
    PromptType[PromptType["record"] = 4] = "record";
    PromptType[PromptType["speechToText"] = 5] = "speechToText";
    PromptType[PromptType["understanding"] = 6] = "understanding";
    PromptType[PromptType["understandingChoice"] = 7] = "understandingChoice";
})(PromptType = exports.PromptType || (exports.PromptType = {}));
var PromptResponseState;
(function (PromptResponseState) {
    PromptResponseState[PromptResponseState["completed"] = 0] = "completed";
    PromptResponseState[PromptResponseState["retry"] = 1] = "retry";
    PromptResponseState[PromptResponseState["canceled"] = 2] = "canceled";
    PromptResponseState[PromptResponseState["terminated"] = 3] = "terminated";
    PromptResponseState[PromptResponseState["failed"] = 4] = "failed";
})(PromptResponseState || (PromptResponseState = {}));
const DEFAULT_PROMPTS = {
    invalidDtmfPrompt: "That's an invalid option.",
    invalidRecognizePrompt: "I'm sorry. I didn't understand.",
    invalidRecordingPrompt: "I'm sorry. There was a problem with your recording.",
    maxRecordingPrompt: "I'm sorry. Your message was too long.",
    recognizeSilencePrompt: "I couldn't hear anything.",
    recordSilencePrompt: "I couldn't hear anything.",
};
exports.NUMBERS = {
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine',
    10: 'ten',
};
class SpeechDialog extends botbuilder_calling_1.Dialog {
    constructor(speech, luis, prompts = DEFAULT_PROMPTS) {
        super();
        this.speech = speech;
        this.luis = luis;
        this.prompts = prompts;
    }
    static recognizeSpeech(session, playPrompt, options = {}) {
        const action = new recognize_speech_action_1.RecognizeSpeechAction(session).playPrompt(createPrompt(session, playPrompt));
        beginDialog(session, PromptType.speechToText, action.toAction(), options);
    }
    static understandSpeech(session, playPrompt, options = {}) {
        const action = new understand_speech_action_1.UnderstandSpeechAction(session).playPrompt(createPrompt(session, playPrompt));
        beginDialog(session, PromptType.understanding, action.toAction(), options);
    }
    static understandChoice(session, playPrompt, options) {
        const action = new understand_speech_action_1.UnderstandSpeechAction(session).playPrompt(createPrompt(session, playPrompt));
        options.choices.forEach((x, i) => {
            const n = i + 1;
            x.variants = x.variants || [];
            x.variants.push(n.toString());
            x.variants.push(exports.NUMBERS[n]);
            x.variants.push(x.name.replace(/\W/g, ' ').toLowerCase());
        });
        beginDialog(session, PromptType.understandingChoice, action.toAction(), options);
    }
    begin(session, args) {
        Object.assign(session.dialogData, args);
        session.send(args.action);
        session.sendBatch(); // TODO ensure MP3 format
    }
    replyReceived(session) {
        const args = session.dialogData;
        const response = session.message;
        const result = { state: PromptResponseState.completed };
        const recordOutcome = response.operationOutcome;
        // recording failed
        if (!recordOutcome) {
            const msg = recordOutcome ? recordOutcome.failureReason : 'Message missing operationOutcome.';
            const error = new Error(`prompt error: ${msg}`);
            session.endDialogWithResult({ resumed: botbuilder_calling_1.ResumeReason.notCompleted, error }); // TODO pass promptType
            return; // TODO retry
        }
        this.receiveRecordOutcome(response, recordOutcome, result);
        // recording invalid
        if (result.state !== PromptResponseState.completed) {
            this.routeResponse(session, result, args);
            return;
        }
        // parse speech
        this.speech.recognize(result.response.recordedAudio, null, (err, speech) => {
            if (err) {
                this.speechError(err, result);
            }
            result.response.speech = speech;
            // parse understanding
            console.log('before luis recognize, the speech result is: ', result.response);
            if (!err && (args.promptType === PromptType.understanding || args.promptType === PromptType.understandingChoice)) {
                console.log('begin luis recognize, speech is: ', speech);
                this.luis.recognize(speech.header.name, (err, luis) => {
                    if (err) {
                        console.log('error on luis recognize: ', err, result);
                        this.luisError(err, result);
                    }
                    console.log('luis recognize result: ', luis);
                    result.response.language = luis;
                    this.routeResponse(session, result, args);
                });
            }
            else {
                this.routeResponse(session, result, args);
            }
        });
    }
    dialogResumed(session, result) {
        if (result.error) {
            session.error(result.error);
        }
        else if (result.resumed === botbuilder_calling_1.ResumeReason.completed) {
            // resumed from a LUIS dialog
            if (result.childId.startsWith('LUIS:')) {
                result.resumed = botbuilder_calling_1.ResumeReason.canceled;
                session.endDialogWithResult(result);
                // resumed from a builtin prompt (confirm)
            }
            else if (result.childId === 'BotBuilder:Prompts') {
                session.dialogData.confirmed = result.response;
                this.replyReceived(session);
            }
            // unknown resume reason, start over
        }
        else {
            this.replyReceived(session);
        }
    }
    selectChoice(session, result, args) {
        const speech = result.response.speech.header.name.toLowerCase();
        const choice = args.choices.find((choice) => choice.name === speech || choice.variants.some((x) => x === speech));
        if (choice) {
            result.response.choice = choice;
        }
        else {
            result.state = PromptResponseState.retry;
            result.retryPrompt = `Sorry, I don't understand ${speech} as a valid option.`;
        }
    }
    luisError(err, result) {
        result.state = PromptResponseState.retry;
        result.retryPrompt = this.prompts.invalidRecognizePrompt;
    }
    speechError(err, result) {
        switch (err.message) {
            case cognitive_speech_client_1.SPEECH_PROPERTY.NOSPEECH:
                result.state = PromptResponseState.retry;
                result.retryPrompt = this.prompts.recordSilencePrompt;
                break;
            case cognitive_speech_client_1.SPEECH_PROPERTY.FALSERECO:
                result.state = PromptResponseState.retry;
                result.retryPrompt = this.prompts.invalidRecognizePrompt;
                break;
            default:
                result.state = PromptResponseState.retry;
                result.retryPrompt = this.prompts.invalidRecordingPrompt;
                break;
        }
    }
    receiveRecordOutcome(response, outcome, result) {
        switch (outcome.completionReason) {
            case botbuilder_calling_1.RecordingCompletionReason.completedSilenceDetected:
            case botbuilder_calling_1.RecordingCompletionReason.completedStopToneDetected:
            case botbuilder_calling_1.RecordingCompletionReason.maxRecordingTimeout:
                result.response = {
                    lengthOfRecordingInSecs: outcome.lengthOfRecordingInSecs,
                    recordedAudio: response.recordedAudio,
                };
                break;
            case botbuilder_calling_1.RecordingCompletionReason.callTerminated:
                result.state = PromptResponseState.terminated;
                break;
            case botbuilder_calling_1.RecordingCompletionReason.temporarySystemFailure:
                result.state = PromptResponseState.failed;
            case botbuilder_calling_1.RecordingCompletionReason.initialSilenceTimeout:
                result.state = PromptResponseState.retry;
                result.retryPrompt = this.prompts.recordSilencePrompt;
            default:
                result.state = PromptResponseState.retry;
                result.retryPrompt = this.prompts.invalidRecordingPrompt;
                break;
        }
    }
    routeResponse(session, result, args) {
        switch (result.state) {
            case PromptResponseState.canceled:
                session.endDialogWithResult({ resumed: botbuilder_calling_1.ResumeReason.canceled });
                break;
            case PromptResponseState.completed:
                if (!this.triggerIntent(session, result.response)) {
                    if (!this.triggerCancel(session, result.response)) {
                        if (args.promptType === PromptType.understandingChoice) {
                            this.selectChoice(session, result, args.action);
                            if (result.state !== PromptResponseState.completed) {
                                return this.routeResponse(session, result, args);
                            }
                        }
                        session.endDialogWithResult({ resumed: botbuilder_calling_1.ResumeReason.completed, response: result.response });
                    }
                }
                break;
            case PromptResponseState.failed:
                session.endDialogWithResult({ resumed: botbuilder_calling_1.ResumeReason.notCompleted, error: new Error('prompt error: service encountered a temporary failure') }); // todo pass promptType
                break;
            case PromptResponseState.retry:
                if (args.maxRetries > 0) {
                    args.maxRetries -= 1;
                    session.send(result.retryPrompt);
                    session.send(args.action);
                    session.sendBatch();
                }
                else {
                    session.endDialogWithResult({ resumed: botbuilder_calling_1.ResumeReason.notCompleted });
                }
                break;
            case PromptResponseState.terminated:
                session.endConversation();
                break;
        }
    }
    triggerCancel(session, result) {
        if (result.language) {
            const intent = result.language.topScoringIntent;
            const intentDialog = luis_dialog_1.LuisDialog.findCancel(session, intent);
            return this.trigger(session, intentDialog, result, 'cancel');
        }
    }
    triggerIntent(session, result) {
        if (result.language) {
            const intent = result.language.topScoringIntent;
            const intentDialog = luis_dialog_1.LuisDialog.findTrigger(session, intent);
            return this.trigger(session, intentDialog, result, 'intent');
        }
    }
    trigger(session, intentDialog, result, action) {
        if (intentDialog && this.canMatch(session)) {
            // user must confirm before triggering new dialog
            if (intentDialog.triggerOptions.confirmPrompt && !session.dialogData.confirmed) {
                botbuilder_calling_1.Prompts.confirm(session, intentDialog.triggerOptions.confirmPrompt);
                return true;
                // launch dialog for this intent
            }
            else if (action === 'intent') {
                session.beginDialog(`LUIS:${intentDialog.id}`, result);
                return true;
                // cancel this intent
            }
            else if (action === 'cancel') {
                const dialogInStack = session.sessionState.callstack.find((x) => x.id === `LUIS:${intentDialog.id}`); // TODO check top of stack only
                // this intent is active
                if (dialogInStack) {
                    const position = session.sessionState.callstack.indexOf(dialogInStack);
                    const returnTo = session.sessionState.callstack[position - 1];
                    session.replaceDialog(returnTo.id);
                    return true;
                }
            }
        }
        return false;
    }
    canMatch(session) {
        const confirmed = session.dialogData.confirmed;
        return confirmed === true || confirmed !== false;
    }
}
exports.SpeechDialog = SpeechDialog;
function beginDialog(session, promptType, action, options) {
    const maxRetries = typeof options.maxRetries === 'number' ? options.maxRetries : 2;
    delete options.maxRetries;
    Object.assign(action, options);
    session.beginDialog(exports.SPEECH_DIALOG_NAME, { action, maxRetries, promptType });
}
function createPrompt(session, playPrompt) {
    if (typeof playPrompt === 'string' || Array.isArray(playPrompt)) {
        return botbuilder_calling_1.PlayPromptAction.text(session, playPrompt).toAction();
    }
    else if (playPrompt.toAction) {
        return playPrompt.toAction();
    }
    else {
        return playPrompt;
    }
}
exports.SPEECH_LIBRARY_NAME = 'Speech';
exports.SPEECH_DIALOG_NAME = `${exports.SPEECH_LIBRARY_NAME}:Prompts`;
function speechLibrary(speech, luis) {
    const lib = new botbuilder_calling_1.Library(exports.SPEECH_LIBRARY_NAME);
    lib.dialog(exports.SPEECH_DIALOG_NAME, new SpeechDialog(speech, luis));
    return lib;
}
exports.speechLibrary = speechLibrary;
