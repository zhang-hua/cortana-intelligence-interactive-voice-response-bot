const MockSpeechService = require('../dist/lib/speech/mock-speech-service').MockSpeechService;
const MockLuisService = require('../dist/lib/luis/mock-luis-service').MockLuisService;
const MockSearchService = require('../dist/lib/mock-search-service').MockSearchService;

describe('bot', () => {
  let mockCallConnector;
  let mockSpeechService;
  let mockLuisService;
  let mockSearchService;
  beforeAll(() => {
    const createBot = require('../dist/lib/create-bot').default;
    const MockCallConnector = require('../dist/lib/mock-call-connector').MockCallConnector;
    const MemoryBotStorage = require('botbuilder-calling').MemoryBotStorage;
    mockCallConnector = new MockCallConnector();
    createBot(mockCallConnector, new MemoryBotStorage());
  });

  beforeEach(() => {
    mockSpeechService = new MockSpeechService('https://speech.platform.bing.com', process.env.SPEECH_REGION);
    mockLuisService = new MockLuisService(process.env.LUIS_APP_ID);
    mockSearchService = new MockSearchService(process.env.SEARCH_SERVICE);
  })

  fit('should process an order', (done) => {
    mockSpeechService
      .auth(200)
      .recognize(200, require('./data/speech/red-bicycle.json'));
    mockLuisService
      .recognize(200, 'red bicycle', require('./data/luis/red-bicycle.json'));
    mockSearchService
      .postQuery(200, 'adventureworks', require('./data/search/query/red-bicycle.json'), require('./data/search/result/red-bicycle.json'));
    mockCallConnector.requestFromFiles([
      `${__dirname}/data/bot/test-red-bicycle/1490997271793-in-conversation.json`,
      `${__dirname}/data/bot/test-red-bicycle/1490997280226-in-conversationResult.json`,
    ], (err, [
      event1,
      event2,
    ]) => {
      if (err) done(err);
      expect(event1).toHaveAction(['answer', 'record']);
      expect(event1).toHavePrompt('Say a product name');

      expect(event2).toHaveAction('recognize');
      expect(event2).toHavePrompt('I found 3 matches. For Road-250, press or say 1. For Road-550-W, say 2. For Mountain-400-W, say 3.');
      expect(event2).toHaveChoices([
        {name:'Road-250', variants:['Road-250', '1'], dtmf:'1'},
        {name:'Road-550-W', variants:['Road-550-W', '2'], dtmf:'2'},
        {name:'Mountain-400-W', variants:['Mountain-400-W', '3'], dtmf:'3'},
      ]);

      done();
    });
  });
});