"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_1 = require("botbuilder");
function default_1(connector) {
    const bot = new botbuilder_1.UniversalBot(connector);
    bot.set('storage', new botbuilder_1.MemoryBotStorage());
    bot.dialog('/', (session) => {
        session.endConversation('Hello! This bot only responds to voice calls. For more information, please see https://github.com/Azure/cortana-intelligence-call-center-solution');
    });
    return bot;
}
exports.default = default_1;
