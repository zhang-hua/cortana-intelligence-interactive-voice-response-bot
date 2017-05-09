import path = require('path');
import async = require('async');
import fs = require('fs');
import _ = require('lodash');
import { ManagementResponse } from 'cognitive-luis-client';
import { Callback } from '.';
import { LUIS_MANAGER_SETTINGS } from '../config';
import { LUIS, LUIS_MANAGER } from '../services';

const ERROR_APP_EXISTS = 'An application with the same name already exists';
const ERROR_KEY_EXISTS = 'A subscription with the same key already exists for the user';

export default function(callback: Callback) {
  const appPath = path.resolve(__dirname, '../../data/luis/AdventureWorks.json');
  async.waterfall([
    async.apply(fs.readFile, appPath, 'utf8'),
    async.asyncify(JSON.parse),
    (app: any, next: Callback) => LUIS_MANAGER.importApp(app, null, continueOnAppExists(next)),
    (resp: ManagementResponse, next: Callback) => train(resp.body, next),
    (appId: string, next: Callback) => publish(appId, next),
  ], callback);
}

function train(appId: string, callback: Callback): void {
  async.waterfall([
    (next: Callback) => LUIS_MANAGER.trainApp(appId, LUIS_MANAGER_SETTINGS.appVersion, next),
    (resp: ManagementResponse, next: Callback) => waitForTraining(appId, next),
    (next: Callback) => next(null, appId),
  ], callback);
}

function waitForTraining(appId: string, callback: Callback): void {
  async.doDuring(
    (next: Callback) => LUIS_MANAGER.trainingStatus(appId, LUIS_MANAGER_SETTINGS.appVersion, next),
    (...args: any[]) => { // typedef for async lacks correct argument definition
      const resp: ManagementResponse = args[0];
      const next: Callback = args[1];
      const pending = resp.body.some((x: any) => x.details.status === 'InProgress'); // TODO check for errors
      if (pending) {
        setTimeout(() => next(null, true), 2500);
      } else {
        setImmediate(next, null, false);
      }
    },
    callback);
}

function publish(appId: string, callback: Callback): void {
  const envPath = path.resolve(__dirname, '../../environment.json');
  async.waterfall([
    (next: any) => {
      LUIS_MANAGER.addSubscriptionKey("ciqs", LUIS_MANAGER_SETTINGS.endPointKey, continueOnKeyExists(next));
    },
    (resp: any, next: any) => {
      LUIS_MANAGER.assignAppKey(appId, LUIS_MANAGER_SETTINGS.appVersion, LUIS_MANAGER_SETTINGS.endPointKey, next);
    },
    (resp: any, next: any) => {
      LUIS_MANAGER.publishApp(appId, { versionId: LUIS_MANAGER_SETTINGS.appVersion, isStaging: false }, next);
    },
    (resp: any, next: any) => {
      fs.readFile(envPath, 'utf8', continueOnFileNotExists(next));
    },
    async.asyncify(JSON.parse),
    (data: any, next: any) => {
      data.LUIS_APP_ID = appId;
      LUIS.setAppId(appId);
      fs.writeFile(envPath, JSON.stringify(data, null, 2), next);
    },
  ], callback);
}

function findAppId(callback: Callback) {
  async.waterfall([
    (next: any) => LUIS_MANAGER.listUserApps(null, next),
    (resp: ManagementResponse, next: any) => {
      const app = resp.body.find((x: any) => x.name === LUIS_MANAGER_SETTINGS.appName);
      if (app) {
        next(null, {body: app.id});
      } else {
        next(new Error(`Cannot find LUIS app with name ${LUIS_MANAGER_SETTINGS.appName}`), null);
      }
    },
  ], callback);
}

function continueOnFileNotExists(callback: Callback): Callback {
  return (err: Error, data: string) => {
    callback(null, data || '{}');
  };
}

function continueOnAppExists(callback: Callback): Callback {
  return (err: Error, resp: ManagementResponse) => {
    if (err && _.get<string>(resp, 'body.error.message') === ERROR_APP_EXISTS) {
      findAppId(callback);
    } else {
      callback(err, resp);
    }
  };
}

function continueOnKeyExists(callback: Callback): Callback {
  return (err: Error, resp: ManagementResponse) => {
    if (err && _.get<string>(resp, 'body.error.message') === ERROR_KEY_EXISTS) {
      callback(null, {body: LUIS_MANAGER_SETTINGS.endPointKey});
    } else {
      callback(err, resp);
    }
  };
}
