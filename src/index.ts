import express = require('express');
import { CallConnector } from 'botbuilder-calling';
import { CALL_SETTINGS, PORT } from './lib/config';
import createBot from './lib/create-bot';
import createServer from './lib/create-server';
// import simpleBot from './lib/simple-bot';

const app = express();
const server = createServer(app);
const connector = new CallConnector(CALL_SETTINGS);
createBot(connector);
// simpleBot(connector);

// routes
app.post('/api/calls', connector.listen());

// start server
server.listen(PORT, () => console.log(`Listening on ${PORT}`));
