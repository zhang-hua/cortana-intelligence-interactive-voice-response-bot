"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const async = require("async");
exports.API_VERSION = '2.0';
class LuisClient {
    constructor(appId, key, region = 'westus') {
        this.appId = appId;
        this.key = key;
        this.region = region;
        this.setDefaults(region, appId, key);
    }
    setAppId(appId) {
        this.setDefaults(this.region, appId, this.key);
    }
    setKey(key) {
        this.setDefaults(this.region, this.appId, key);
    }
    setRegion(region) {
        this.setDefaults(region, this.appId, this.key);
    }
    recognize(text, callback) {
        async.waterfall([
            (next) => {
                console.log('LUIS client recognize request:\n', this.request);
                console.log('LUIS client recognize request url:\n', this.request.baseUrl);
                this.request.get('', { qs: { q: text } }, next)
            },
            (resp, body, next) => {
                console.log('LUIS client recognize response:\n', resp);
                if (resp.statusCode === 200) {
                    setImmediate(callback, null, body);
                }
                else {
                    setImmediate(callback, new Error(`LUIS returned HTTP ${resp.statusCode}: ${resp.statusMessage}`));
                }
            },
        ], callback);
    }
    setDefaults(region, appId, key) {
        this.request = request.defaults({
            baseUrl: `https://${region}.api.cognitive.microsoft.com/luis/v${exports.API_VERSION}/apps/${appId}`,
            json: true,
            qs: { 'subscription-key': key },
        });
        console.log('LUIS client setDefaults\n', this.request);
    }
}
exports.LuisClient = LuisClient;
