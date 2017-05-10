import async = require('async');
import fs = require('fs');
import path = require('path');
import configureLuis from './luis';
import configureSearch from './search';
import configureSql from './sql';
import { LUIS_MANAGER_SETTINGS } from '../config';
import { Request, Response, NextFunction } from 'express';

export type Callback = (err: Error, ...args: any[]) => void;

const CONFIGURED = path.resolve(__dirname, '../../data/.configured');

export function configureServices(callback: Callback) {
  fs.readFile(CONFIGURED, (err) => {
    // run configuration if status file not present
    if (err && err.code === 'ENOENT') {
      configure(callback);

    // read error
    } else if (err) {
      callback(err);

    // already configured
    } else {
      callback(null);
    }
  });
}

export function configurationMiddleware(req: Request, res: Response, next: NextFunction) {

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
};

function configure(callback: Callback) {
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
    (next: Callback) => fs.writeFile(CONFIGURED, '', next),
  ], callback);
}
