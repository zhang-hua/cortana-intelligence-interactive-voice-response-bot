/// <reference types="node" />
import { SpeechAuthClient } from './speech-auth-client';
export declare const SPEECH_STATUS: {
    [key: string]: SpeechStatus;
};
export declare const SPEECH_PROPERTY: {
    [key: string]: SpeechProperty;
};
export declare type SpeechStatus = 'success' | 'error';
export declare type SpeechProperty = 'ERROR' | 'FALSERECO' | 'HIGHCONF' | 'LOWCONF' | 'MIDCONF' | 'NOSPEECH';
export interface SpeechOptions {
    locale?: string;
    scenarios?: string;
    sampleRate?: number;
}
export interface SpeechResult {
    header: RecognizedSpeechHeader;
    results: RecognizedSpeechResult[];
    version: string;
}
export interface RecognizedSpeechHeader extends RecognizedSpeech {
    status: SpeechStatus;
}
export interface RecognizedSpeechResult extends RecognizedSpeech {
    confidence: number;
}
export declare type SpeechCallback = (err: Error, speech: SpeechResult) => void;
export interface RecognizedSpeech {
    name: string;
    lexical: string;
    properties: {
        [key: string]: string;
    };
    scenario: string;
}
export declare const BING_SPEECH_ENDPOINT = "https://speech.platform.bing.com/recognize";
export declare class SpeechClient {
    private auth;
    private request;
    private instanceId;
    constructor(auth: SpeechAuthClient, endpoint?: string);
    recognize(buf: Buffer, options: SpeechOptions, callback: SpeechCallback): void;
    private requestTextFromSpeech(buf, token, options, callback);
    private receiveTextFromSpeech(resp, body, callback);
    private errorMessage(speech);
}
