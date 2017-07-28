"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_calling_1 = require("botbuilder-calling");
const botbuilder_calling_speech_1 = require("botbuilder-calling-speech");
const services_1 = require("../services");
const settings_1 = require("../settings");
const PRODUCT_INFO_NAME = 'ProductInfo';
const PRODUCT_INFO_ROOT = '/';
exports.PRODUCT_INFO_DIALOG = `${PRODUCT_INFO_NAME}:${PRODUCT_INFO_ROOT}`;
exports.PRODUCT_INFO_LIB = new botbuilder_calling_1.Library(PRODUCT_INFO_NAME);
exports.PRODUCT_INFO_LIB.dialog(PRODUCT_INFO_ROOT, new botbuilder_calling_speech_1.LuisDialog([
    (session, args, next) => {
        console.log('args', args);
        const queryText = args.language.entities.filter((x) => x.type === 'product').map((x) => x.entity)[0]
            || args.speech.header.name;
        const query = { search: queryText, searchFields: 'name', select: 'name,description_EN,minListPrice', top: 1 };
        console.log('query', query);
        services_1.SEARCH.search(settings_1.SEARCH_SETTINGS.index, query, (err, resp) => {
            if (err) {
                session.error(err);
                session.endDialog('Sorry, there was a problem finding your information.');
            }
            else if (resp.result.value.length) {
                const info = resp.result.value[0];
                const price = Math.ceil(info.minListPrice);
                session.endDialog(`Here's what I found for ${info.name}: ${info.description_EN}; Starting at ${price} dollars`);
            }
        });
    },
]).triggerAction({
    match: 'intent.product.info',
}));
exports.PRODUCT_INFO_LIB.dialog('/price', new botbuilder_calling_speech_1.LuisDialog([
    (session, args, next) => {
        console.log('args', args);
        const queryText = args.language.entities.filter((x) => x.type === 'product').map((x) => x.entity)[0]
            || args.speech.header.name;
        const query = { search: queryText, searchFields: 'name', select: 'name,minListPrice,maxListPrice', top: 1 };
        console.log('query', query);
        services_1.SEARCH.search(settings_1.SEARCH_SETTINGS.index, query, (err, resp) => {
            if (err) {
                session.error(err);
                session.endDialog('Sorry, there was a problem finding your information.');
            }
            else if (resp.result.value.length) {
                const info = resp.result.value[0];
                const priceLo = Math.ceil(info.minListPrice);
                const priceHi = Math.ceil(info.maxListPrice);
                if (priceLo === priceHi) {
                    session.endDialog(`The ${info.name} costs ${priceLo} dollars.`);
                }
                else {
                    session.endDialog(`The ${info.name} ranges in price from ${priceLo} to ${priceHi} dollars.`);
                }
            }
        });
    },
]).triggerAction({
    match: 'intent.product.price',
}));
