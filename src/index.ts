import express = require('express');
import { CallConnector } from 'botbuilder-calling';
import { CALL_SETTINGS, PORT } from './lib/config';
import { configureServices, configurationMiddleware } from './lib/configure';
import createBot from './lib/create-bot';
import createServer from './lib/create-server';

const app = express();
const server = createServer(app);
const connector = new CallConnector(CALL_SETTINGS);

// todo move this into app calls
configureServices((err) => {
  if (err) {
    throw err;
  }
  console.log('Services ready');
  createBot(connector);
});

// routes
app.get('/api/configure', configurationMiddleware);
app.post('/api/calls', connector.listen());

// start server
server.listen(PORT, () => console.log(`Listening on ${PORT}`));
