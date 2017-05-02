process.env.CALLBACK_URL = 'http://localhost/mock/api/calls';
process.env.MICROSOFT_APP_ID = '00000000-0000-0000-0000-000000000000';
process.env.MICROSOFT_APP_PASSWORD = 'mock-app-pass';
process.env.port = 0;
process.env.LUIS_REGION = 'westus';
process.env.LUIS_APP_ID = '00000000-0000-0000-0000-000000000000';
process.env.LUIS_KEY = 'mock-luis-key';
process.env.SPEECH_KEY = 'mock-speech-key';
process.env.SPEECH_ENDPOINT = 'https://speech.platform.bing.com/recognize';
process.env.SPEECH_REGION = '';
process.env.SEARCH_SERVICE = 'mock-search-service';
process.env.SEARCH_KEY = 'mock-search-key';
process.env.NO_LOCAL_ENV = 'true';

const nock = require('nock');
const util = require('../../dist/lib/bot-util').util;

beforeEach(() => {
  util.speech.auth.token = null;
});

beforeAll(() => {
  nock.disableNetConnect();
});

afterAll(() => {
  nock.enableNetConnect();
});

afterEach(() => {
  expect(nock.isDone()).toBe(true);
  nock.cleanAll();
});