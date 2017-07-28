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
        session.beginDialog('/smartmobot');
    },
    // (session, args, next) => {
    //     botbuilder_calling_1.Prompts.confirm(session, `You are ordering ${args.response.name} ${args.response.sku}. Would you like to order another product?`);
    // },
    // (session, args, next) => {
    //     if (args.response) {
    //         session.beginDialog('/');
    //     }
    //     else {
    //         session.endDialog('Thanks for your order! Goodbye.');
    //     }
    // },
]);
exports.ORDER_PRODUCT_LIB.dialog('/smartmobot', [
    (session, args, next) => {
        botbuilder_calling_speech_1.SpeechDialog.understandSpeech(session, 'Hello! what can I do for you?');
    },
    (session, args, next) => {
        console.log('Bot Received Intention:\n', args.response.language);
        if (args.error) {
            return session.error(args.error);
        }
        else if (args.response.language.topScoringIntent.intent === 'HouseAgent' ) {
            console.log('Bot Received Intent: HouseAgent' );
            console.log('Bot Speech Reponse:', 'sorry, I do not have any interest in real estate. Goodbye!' );
            return session.endDialog('sorry, I do not have any interest in real estate. Goodbye!');
        }
        else if (args.response.language.topScoringIntent.intent === 'InsuranceAgent' ) {
            console.log('Bot Received Intent: InsuranceAgent' );
            console.log('Bot Speech Reponse:', 'No thanks! I already have insurance. Goodbye!' );
            return session.endDialog('No thanks! I already have insurance. Goodbye!');
        }
        else if (args.response.language.topScoringIntent.intent === 'FinanceAgent' ) {
            console.log('Bot Received Inent: FinanceAgent' );
            console.log('Bot Speech Reponse:', 'No, I do not want to invest! Goodbye!' );
            return session.endDialog('No, I do not want to invest! Goodbye!');
        }
        else if (args.response.language.topScoringIntent.intent === 'FraudAgent' ) {
            console.warn('Bot Received Intent: SecurityAgent' );
            console.log('Bot Speech Reponse:', 'Do not trick me!' );
            return session.endDialog('Do not trick me!');
        }
        else {
            console.log('Bot Received normal call' );
            console.log('Bot Speech Reponse:', 'Hold on please. oops, Mr. Zhang is not available now, will let him know later.' );
            session.send('Hold on please. oops, Mr. Zhang is not available now, will let him know later.');
            botbuilder_calling_speech_1.SpeechDialog.understandSpeech(session, 'can you leave a message for him?');
        }
    },
    (session, args, next) => {
        console.log('Bot Received normal call' );
        console.log('Bot Speech Reponse:', 'I have got your message, Thanks! Goodbye!' );
        return session.endDialog('I have got your message, Thanks! Goodbye!');
    },
]);
exports.ORDER_PRODUCT_LIB.dialog('/findProduct', [
    (session, args, next) => {
        botbuilder_calling_speech_1.SpeechDialog.understandSpeech(session, 'Hi, Please say a product name.');
    },
    (session, args, next) => {
        console.log('args:\n', args);
        console.log('Bot Received Intention:\n', args.response.language);
        if (args.error) {
            return session.error(args.error);
        }
        else if (args.resumed === botbuilder_calling_1.ResumeReason.canceled) {
            return session.replaceDialog('/findProduct');
        }
        else if (args.response.language.topScoringIntent.intent === 'HouseAgent') {
            session.send('I do not interest house. Goodbye!');
            //return session.replaceDialog('/smartmobot')
        }
        else if (args.response.language.topScoringIntent.intent === 'InsuranceAgent') {
            session.send('I do not interest insurance. Goodbye!');
            //return session.replaceDialog('/smartmobot')
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
