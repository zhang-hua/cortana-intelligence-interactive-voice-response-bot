import http = require('http');
import https = require('https');
import process = require('process');

export default function createServer(...args: any[]): https.Server | http.Server {
  return process.env.HTTPS === 'on'
    ? https.createServer(args)
    : http.createServer(args[0]);
}
