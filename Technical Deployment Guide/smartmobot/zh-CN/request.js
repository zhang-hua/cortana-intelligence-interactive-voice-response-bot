"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const async = require("async");
class Request {
    constructor(defaults) {
        this.api = request.defaults(defaults);
    }
    get(uri, options, callback) {
        console.log('LUIS Client Request:\n', uri, options);
        this.request('GET', uri, options, callback);
    }
    post(uri, options, callback) {
        console.log('LUIS Client Request:\n', uri, options);
        this.request('POST', uri, options, callback);
    }
    delete(uri, options, callback) {
        this.request('DELETE', uri, options, callback);
    }
    put(uri, options, callback) {
        console.log('LUIS Client Request:\n', uri, options);
        this.request('PUT', uri, options, callback);
    }
    request(method, uri, options, callback) {
        async.waterfall([
            (next) => {
                console.log('LUIS Client sending request like:\n', uri, options);
                this.api[method.toLowerCase()](uri, options, next);
            },
            (resp, body, next) => {
                console.log('LUIS Client Response:\n', resp, body);
                if (resp.statusCode < 200 || resp.statusCode >= 300) {
                    const message = resp.headers['content-type'].startsWith('application/json')
                        ? JSON.stringify(body)
                        : `Request returned HTTP ${resp.statusCode}`;
                    setImmediate(next, new Error(message), resp); // TODO retry with backoff
                }
                else {
                    setImmediate(next, null, resp);
                }
            },
        ], callback);
    }
}
exports.Request = Request;
