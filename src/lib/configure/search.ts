import async = require('async');
import path = require('path');
import fs = require('fs');
import { Callback } from '.';
import { SQL_SETTINGS } from '../config';
import { SEARCH } from '../services';

const rootDir = '../../data/search';

export default function(callback: Callback) {
  const connectionString = formatConnectionString(SQL_SETTINGS.server, SQL_SETTINGS.userName, SQL_SETTINGS.password, SQL_SETTINGS.options.database);

  async.series([

    // create index
    (next: Callback) => createResource('schema.json', (schema, done) => {
      SEARCH.createIndex(schema, done);
    }, next),

    // create datasource
    (next: Callback) => createResource('datasource.json', (datasource, done) => {
      datasource.credentials.connectionString = connectionString;
      SEARCH.createDatasource(datasource, done);
    }, next),

    // create indexer
    (next: Callback) => createResource('indexer.json', (indexer, done) => {
      SEARCH.createIndexer(indexer, done);
    }, next),

    // run the indexer
    (next: Callback) => SEARCH.runIndexer('products', callback),

  ], callback);
}

function continueOnExists(callback: Callback): Callback {
  return (err: Error) => {
    if (!err || err.message.includes('already exists')) {
      callback(null);
    } else {
      callback(err);
    }
  };
}

function createResource(filePath: string, create: (resource: any, done: Callback) => void, callback: Callback): void {
  async.waterfall([
    async.apply(fs.readFile, resolve(filePath), 'utf8'),
    async.asyncify(JSON.parse),
    (resource: any, next: Callback) => create(resource, continueOnExists(next)),
  ], callback);
}

function resolve(filePath: string): string {
  return path.resolve(__dirname, rootDir, filePath);
}

function formatConnectionString(host: string, user: string, password: string, database: string): string {
  return `Server=tcp:${host},1433;
    Initial Catalog=${database};
    Persist Security Info=False;
    User ID=${user};
    Password=${password};
    MultipleActiveResultSets=False;
    Encrypt=True;
    TrustServerCertificate=False;
    Connection Timeout=30;`;
}
