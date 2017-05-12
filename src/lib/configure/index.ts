import async = require('async');
import fs = require('fs');
import path = require('path');
import { CallSession, IDialogResult, IMiddlewareMap } from 'botbuilder-calling';
import { NextFunction, Request, Response } from 'express';
import { LUIS_MANAGER_SETTINGS } from '../config';
import configureLuis from './luis';
import configureSearch from './search';
import configureSql from './sql';

export type Callback = (err: Error, ...args: any[]) => void;

const CONFIGURED_PATH = path.resolve(__dirname, '../../data/.configured');

export const CONFIG_STATE = { configured: false, configuring: false };

export function configureServices(callback: Callback) {

  isConfigured((err, configured) => {
    if (err) {
      callback(err);
    } else if (configured) {
      callback(null);
    } else {
      configure(callback);
    }
  });
}

function isConfigured(callback: (err: Error, configured: boolean) => void): void {
  if (CONFIG_STATE.configured) {
    return callback(null, true);
  } else {
    fs.readFile(CONFIGURED_PATH, (err) => {
      if (err && err.code === 'ENOENT') {
        callback(null, false);
      } else if (err) {
        callback(err, null);
      } else {
        CONFIG_STATE.configured = true;
        callback(null, true);
      }
    });
  }
}

export function configurationWebMiddleware(req: Request, res: Response, next: NextFunction) {

  // app settings have been persisted
  if (LUIS_MANAGER_SETTINGS.key) {
    configureServices((err) => {
      if (err) {
        next(err);
      } else {
        res.status(200).send();
      }
    });

  // app settings have NOT been persisted
  // client should re-attempt request after a few seconds
  } else {
    setTimeout(() => res.redirect(req.url), 2500);
  }
}

export const configurationBotMiddleware: IMiddlewareMap = {
  botbuilder: (session: CallSession, next: () => void): void => {

    if (CONFIG_STATE.configuring) {
      return next();
    }

    isConfigured((err, configured) => {
      if (err) {
        return onError(err);
      } else if (configured) {
        return next();
      }

      const timer = setInterval(() => session.send('Please stand by.').sendBatch(), 10000);
      session.send('Please stand by while this bot configures itself.').sendBatch();

      configureServices((err) => {
        clearInterval(timer);
        if (err) {
          return onError(err);
        } else {
          next();
        }
      });

    });

    function onError(err: Error) {
      session.error(err);
      session.endConversation('Sorry, there was a problem configuring this bot. Goodbye');
      next();
    }
  },
};

function configure(callback: Callback) {
  CONFIG_STATE.configuring = true;
  async.series([

    (next: Callback) => async.parallel([

      // these must run in sequence
      (next: Callback) => async.series([
        (next: Callback) => configureSql(next),
        (next: Callback) => configureSearch(next),
      ], next),

      // configure luis in parallel
      (next: Callback) => configureLuis(next),
    ], next),

    // write status file so we can short-circuit next time
    (next: Callback) => {
      fs.writeFile(CONFIGURED_PATH, '', next);
      CONFIG_STATE.configured = true;
      CONFIG_STATE.configuring = false;
    },
  ], callback);
}
