"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const _ = require("lodash");
const uuid = require("uuid");
const async = require("async");
exports.SPEECH_STATUS = {
    error: 'error',
    success: 'success',
};
exports.SPEECH_PROPERTY = {
    ERROR: 'ERROR',
    FALSERECO: 'FALSERECO',
    HIGHCONF: 'HIGHCONF',
    LOWCONF: 'LOWCONF',
    MIDCONF: 'MIDCONF',
    NOSPEECH: 'NOSPEECH',
};
exports.BING_SPEECH_ENDPOINT = 'https://speech.platform.bing.com/recognize';
const GLOBAL_APP_ID = '31b3d95b-af74-4550-9619-de76fe33f0f0';
const RECOGNIZE_DEFAULTS = { locale: 'en-US', scenarios: 'ulm', sampleRate: 16000 };
class SpeechClient {
    constructor(auth, endpoint = exports.BING_SPEECH_ENDPOINT) {
        this.auth = auth;
        this.instanceId = uuid.v4();
        this.request = request.defaults({
            baseUrl: endpoint,
            qs: {
                'appid': GLOBAL_APP_ID,
                'device.os': 'Windows',
                'format': 'json',
                'instanceid': this.instanceId,
                'version': '3.0',
            },
        });
    }
    recognize(buf, options, callback) {
        options = _.defaults(options, RECOGNIZE_DEFAULTS);
        async.waterfall([
            (next) => {
                this.auth.getToken(next);
            },
            (token, next) => {
                this.requestTextFromSpeech(buf, token, options, next);
            },
            (resp, body, next) => {
                this.receiveTextFromSpeech(resp, body, next);
            },
        ], callback);
    }
    requestTextFromSpeech(buf, token, options, callback) {
        this.request.post('', {
            body: buf,
            headers: {
                "authorization": `Bearer ${token}`,
                'content-type': `audio/wav; samplerate=${options.sampleRate}`,
            },
            qs: {
                locale: options.locale,
                requestid: uuid.v4(),
                scenarios: options.scenarios,
            },
        }, callback);
    }
    receiveTextFromSpeech(resp, body, callback) {
        if (resp.statusCode !== 200) {
            setImmediate(callback, new Error(`Speech recognizer returned HTTP ${resp.statusCode}: ${resp.statusMessage}`));
            return;
        }
        const speech = JSON.parse(body);
        if (speech.header.status !== exports.SPEECH_STATUS.success) {
            setImmediate(callback, new Error(this.errorMessage(speech)));
            return;
        }
        if (speech.results) {
            speech.results
                .filter((x) => x.confidence)
                .forEach((x) => x.confidence = parseFloat(x.confidence.toString()));
        }
        setImmediate(callback, null, speech);
    }
    errorMessage(speech) {
        if (!speech || !speech.header || !speech.header.properties) {
            return exports.SPEECH_PROPERTY.ERROR;
        }
        else if (speech.header.properties.hasOwnProperty(exports.SPEECH_PROPERTY.NOSPEECH)) {
            return exports.SPEECH_PROPERTY.NOSPEECH;
        }
        else if (speech.header.properties.hasOwnProperty(exports.SPEECH_PROPERTY.FALSERECO)) {
            return exports.SPEECH_PROPERTY.FALSERECO;
        }
        else {
            return exports.SPEECH_PROPERTY.ERROR;
        }
    }
}
exports.SpeechClient = SpeechClient;
