'use strict';
const util = require('util');
const nodeSslExpiryAlert = require('../lib');
(async () => {
    try {
        const alertSslExpiry = await nodeSslExpiryAlert({
            host: 'github.com',
            port: 443,
            alertDaysBeforeExpiry: 1,
            alertTransport: {
                name: 'mailgun',
                domain: process.env.mailgunDomain,
                apiKey: process.env.mailgunApiKey,
                emailFrom: process.env.emailFrom,
                emailFromName: process.env.emailFromName,
                emailsTo: [
                    'yide@webtempmail.online'
                ]
            }
        });
        console.log(alertSslExpiry);
    } catch (err) {
        console.log(util.format('SSL Expiry Alert Error: %s', err.message));
    }
})();
