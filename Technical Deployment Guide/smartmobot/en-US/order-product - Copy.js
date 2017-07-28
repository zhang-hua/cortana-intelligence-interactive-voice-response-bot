"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_calling_1 = require("botbuilder-calling");
const botbuilder_calling_speech_1 = require("botbuilder-calling-speech");
const app_1 = require("../app");
const ORDER_PRODUCT_NAME = 'OrderProduct';
const ORDER_PRODUCT_ROOT = '/';
exports.ORDER_PRODUCT_DIALOG = `${ORDER_PRODUCT_NAME}:${ORDER_PRODUCT_ROOT}`;
exports.ORDER_PRODUCT_LIB = new botbuilder_calling_1.Library(ORDER_PRODUCT_NAME);
exports.ORDER_PRODUCT_LIB.dialog(ORDER_PRODUCT_ROOT, [
    (session, args, next) => {
        session.beginDialog('/findProduct');
    },
    (session, args, next) => {
        botbuilder_calling_1.Prompts.confirm(session, `You are ordering ${args.response.name} ${args.response.sku}. Would you like to order another product?`);
    },
    (session, args, next) => {
        if (args.response) {
            session.beginDialog('/');
        }
        else {
            session.endDialog('Thanks for your order! Goodbye.');
        }
    },
]);
exports.ORDER_PRODUCT_LIB.dialog('/findProduct', [
    (session, args, next) => {
        botbuilder_calling_speech_1.SpeechDialog.understandSpeech(session, 'Hi, Please say a product name.');
    },
    (session, args, next) => {
        if (args.error) {
            return session.error(args.error);
        }
        else if (args.resumed === botbuilder_calling_1.ResumeReason.canceled) {
            return session.replaceDialog('/findProduct');
        }
        app_1.APP.findProduct(args.response.speech, args.response.language, (err, matches) => {
            if (err) {
                return session.error(err);
            }
            session.dialogData.luis = args.response.language;
            if (matches.length === 0) {
                session.send(`Sorry, I did not find any products matching "${args.response.speech.header.name}".`);
                session.replaceDialog('/findProduct');
            }
            else if (matches.length > 1) {
                session.beginDialog('/chooseProductName', matches);
            }
            else {
                next({ response: matches[0], resumed: botbuilder_calling_1.ResumeReason.forward });
            }
        });
    },
    (session, args, next) => {
        const luis = session.dialogData.luis;
        session.beginDialog('/chooseProductSKU', {
            entities: luis.entities,
            product: args.response.name,
            selected: {},
            skus: JSON.parse(args.response.products || '{}'),
        });
    },
]);
exports.ORDER_PRODUCT_LIB.dialog('/chooseProductName', [
    (session, args, next) => {
        const matches = session.dialogData.matches = args;
        const choices = matches.map((x) => ({ name: x.name }));
        const choicesText = choices.map((x, i) => `For ${x.name}, say ${i + 1}}.`).join(' ');
        const promptText = `I found ${matches.length} matches. ${choicesText}`;
        botbuilder_calling_speech_1.SpeechDialog.understandChoice(session, promptText, { choices });
    },
    (session, args, next) => {
        if (args.error) {
            return session.error(args.error);
        }
        else if (args.resumed === botbuilder_calling_1.ResumeReason.canceled) {
            return session.replaceDialog('/chooseProductName', session.dialogData.matches);
        }
        const matches = session.dialogData.matches;
        const product = matches.find((x) => x.name === args.response.choice.name);
        session.endDialogWithResult({ response: product, resumed: botbuilder_calling_1.ResumeReason.completed });
    },
]);
exports.ORDER_PRODUCT_LIB.dialog('/chooseProductSKU', [
    (session, args, next) => {
        session.dialogData.args = args;
        const skus = app_1.APP.getSkuChoices(args);
        if (skus.length === 1) {
            const sku = { name: args.product, sku: skus[0].productNumber };
            return session.endDialogWithResult({ response: sku, resumed: botbuilder_calling_1.ResumeReason.completed });
        }
        const attribute = app_1.APP.getNextSkuAttribute(skus);
        args.attribute = attribute.name;
        const choices = attribute.choices.map((x, i) => ({
            dtmfVariation: (i + 1).toString(),
            name: x,
            speechVariation: [x, (i + 1).toString()],
        }));
        const choicesText = attribute.choices.slice(0, -1).join(', ') + ` or ${attribute.choices[attribute.choices.length - 1]}`;
        const promptText = `What ${attribute.name}? ${choicesText}.`;
        botbuilder_calling_1.Prompts.choice(session, promptText, choices);
    },
    (session, choice, next) => {
        if (choice.error) {
            session.error(choice.error);
        }
        else {
            const skuData = session.dialogData.args;
            skuData.selected[skuData.attribute] = choice.response.entity;
            session.beginDialog('/chooseProductSKU', skuData);
        }
    },
]);
