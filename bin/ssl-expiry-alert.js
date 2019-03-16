#!/usr/bin/env node
'use strict';
const util = require('util');
const nodeSslExpiryAlert = require('../lib');
const DEFAULT_OPTIONS = {
    host: '',
    port: 443,
    alertDaysBeforeExpiry: 60,
    alertTransport: {}
};

function parseOptions(args) {
    return new Promise(async (resolve, reject) => {
        let options = Object.assign({}, DEFAULT_OPTIONS);
        try {
            if (args.length == 0) {
                throw new Error('No Argument Found.');
            }
            let parseOptions = [];
            while (args.length > 0) {
                parseOptions.push(args.splice(0, 2));
            }
            for (let option of parseOptions) {
                options = await checkOption(option, options);
            }
            await checkTransport(options);
            return resolve(options);
        } catch (err) {
            return reject(err);
        }
    });
}

function checkOption(option, options) {
    return new Promise((resolve, reject) => {
        if (option.length != 2) {
            return reject(new Error('Argument passed to Command Line get Error.'));
        }
        try {
            let key = option[0];
            let value = option[1];
            if (/^\-\-[a-zA-Z\-]{2,}/.test(key)) {
                key = key.substring(2).toLowerCase();
            } else if (/^\-[a-zA-Z]/.test(key)) {
                key = key.substring(1).toLowerCase();
            } else {
                return reject(new Error('Invalid Option Format, Should start with -- or -'));
            }
            switch (key) {
                case 'h':
                case 'host':
                    options['host'] = value;
                    break;
                case 'p':
                case 'port':
                    value = isNaN(parseInt(value, 10)) ? 0 : parseInt(value, 10);
                    if (value <= 0 && value > 65535) {
                        return reject(new Error('Invalid Port Number'));
                    }
                    options['port'] = value;
                    break;
                case 'd':
                case 'days-before':
                    value = isNaN(parseInt(value, 10)) ? 0 : parseInt(value, 10);
                    if (value <= 0) {
                        return reject(new Error('Days to Alert Before Expiry should be Positive Number'));
                    }
                    options['alertDaysBeforeExpiry'] = value;
                    break;
                case 't':
                case 'transport':
                    options['alertTransport']['name'] = value;
                    break;
                case 'email-from':
                    options['alertTransport']['emailFrom'] = value;
                    break;
                case 'emails-to':
                    if (value.indexOf(',') > -1) {
                        value = value.split(',');
                    } else {
                        value = [value];
                    }
                    options['alertTransport']['emailsTo'] = value;
                    break;
                case 'mailgun-domain':
                    options['alertTransport']['domain'] = value;
                    break;
                case 'mailgun-apikey':
                    options['alertTransport']['apiKey'] = value;
                    break;
                default:
                    return reject(new Error('Invalid Option, Please check the above Argument Setup'));
            }
            return resolve(options);
        } catch (err) {
            return reject(err);
        }
    });
}

function checkTransport(options) {
    return new Promise((resolve, reject) => {
        // Check Command Line exist with Transport Name and do the further Checking
        if (typeof options.alertTransport.name !== 'undefined') {
            switch (options.alertTransport.name) {
                case 'mailgun':
                    if (typeof options.alertTransport.emailFrom === 'undefined') {
                        return reject(new Error('Email From was not defined for Mailgun'));
                    }
                    if (typeof options.alertTransport.emailsTo === 'undefined') {
                        return reject(new Error('Emails To was not defined for Mailgun'));
                    }
                    if (typeof options.alertTransport.domain === 'undefined') {
                        return reject(new Error('Domain was not defined for Mailgun'));
                    }
                    if (typeof options.alertTransport.apiKey === 'undefined') {
                        return reject(new Error('Api Key was not defined for Mailgun'));
                    }
                    break;
                default:
                    return reject(new Error('Alert Transport you Entered was not Supported'));
            }
        }
        return resolve(options);
    });
}

function displayHelp() {
    return new Promise((resolve, reject) => {
        console.log(`
Usage
    $ ssl-expiry-alert
Options
    --host -h          Define the Host
    --port -p          Define the Port, if not Define, Default: 443
    --days-before -d   Define the Days to Alert Before Certificate Expire, Default: 30 Days
    --transport -t     Define the Alert Method, only Display the Result on the Console, Available Transport see belows
    Available Transports: 
    mailgun

    (If mailgun)
    --email-from       Define the Email From which Alert Email Sent From
    --emails-to        Define the Email To Addresses which Alert Email Sent To, use Comma as Separator to send Multiple Destinations
    (If mailgun)
    --mailgun-domain   Define the Mailgun Domain which needed for Mailgun API Call
    --mailgun-apikey   Define the Mailgun API Key which needed for Mailgun API Call
`);
        return resolve();
    });
}

(async () => {
    try {
        const options = await parseOptions(process.argv.slice(2));
        const alertSslExpiry = await nodeSslExpiryAlert(options);
        console.log(alertSslExpiry);
    } catch (err) {
        await displayHelp();
        console.log(util.format('Error: ', err.message));
    }
})();