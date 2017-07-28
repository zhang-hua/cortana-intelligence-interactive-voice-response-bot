"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_calling_1 = require("botbuilder-calling");
const configure_1 = require("./configure");
const lookup_order_1 = require("./libraries/lookup-order");
const order_product_1 = require("./libraries/order-product");
const product_info_1 = require("./libraries/product-info");
const services_1 = require("./services");
const settings_1 = require("./settings");
function createBot(connector, botStorage) {
    settings_1.BOT_SETTINGS.storage = botStorage || services_1.BOT_STORAGE;
    console.log('BOT_SETTINGS:', settings_1.BOT_SETTINGS);
    settings_1.BOT_SETTINGS.promptDefaults = {
      culture: 'zh-CN',
      voice: 'male',
    };
    settings_1.BOT_SETTINGS.recognizeDefaults = {
      culture: 'zh-CN',
    };
    const bot = new botbuilder_calling_1.UniversalCallBot(connector, settings_1.BOT_SETTINGS);
    console.log('BOT_SETTINGS:', settings_1.BOT_SETTINGS);
    bot.on('error', console.error);
    bot.library(services_1.BOT_SPEECH_LIB);
    bot.library(order_product_1.ORDER_PRODUCT_LIB);
    bot.library(product_info_1.PRODUCT_INFO_LIB);
    bot.library(lookup_order_1.LOOKUP_ORDER_LIB);
    bot.dialog('/', (session, args, next) => session.beginDialog(order_product_1.ORDER_PRODUCT_DIALOG));
    bot.use(configure_1.configurationBotMiddleware);
    return bot;
}
exports.default = createBot;
