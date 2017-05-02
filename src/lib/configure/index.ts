import async = require('async');
import fs = require('fs');
import path = require('path');
import configureLuis from './luis';
import configureSearch from './search';
import configureSql from './sql';

export type Callback = (err: Error, ...args: any[]) => void;

const CONFIGURED = path.resolve(__dirname, '../../data/.configured');

export default function(callback: Callback) {
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
