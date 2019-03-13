'use strict';
const tls = require('tls');
const util = require('util');
const mailgun = require('mailgun.js');

// Simple Email Regular Expression Check
const SIMPLE_EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// Get TLS Options from Constructor
function getTlsOptions(options) {
    return new Promise((resolve, reject) => {
        // Validate Host Variable
        if (typeof options.host === 'undefined') {
            return reject(new Error('Missing Host'));
        }
        if (options.host.trim() == '') {
            return reject(new Error('Host cannot be Empty'));
        }
        // Validate Port Variable, Default Port 443
        if (typeof options.port === 'undefined') {
            options['port'] = 443;
        }
        // Convert Port to Integer and Validate
        options.port = isNaN(parseInt(options.port, 10)) ? 0 : parseInt(options.port, 10);
        if (options.port <= 0 && options.port > 65535) {
            return reject(new Error('Invalid Port Number'));
        }
        // If Server Name was undefined, Assume use Host as Server Name for SNI Compatible
        if (typeof options.servername === 'undefined') {
            options['servername'] = options.host;
        }
        // If Timeout was undefined, Set Default Timeout to 10 Second
        if (typeof options.timeout === 'undefined') {
            options['timeout'] = 10;
        }
        const tlsOptions = {
            host: options.host,
            port: options.port,
            servername: options.servername,
            timeout: options.timeout
        };
        return resolve(tlsOptions);
    });
}

// Check Alert Transport
function getAlertTransport(options) {
    return new Promise((resolve, reject) => {
        let alertTransport = null;
        // If Not Define Alert Object, assume Return SSL Checking Result Locally
        if (typeof options.alertTransport !== 'undefined' && typeof options.alertTransport.name !== 'undefined') {
            // Validate Transport Type
            switch (options.alertTransport.name) {
                case 'mailgun':
                    if (typeof options.alertTransport.domain === 'undefined') {
                        return reject(new Error('Missing Alert Transport Mailgun Domain'));
                    }
                    if (typeof options.alertTransport.apiKey === 'undefined') {
                        return reject(new Error('Missing Alert Transport Mailgun API Key'));
                    }
                    if (typeof options.alertTransport.emailFrom === 'undefined') {
                        return reject(new Error('Missing Alert Transport Email From'));
                    } else if (!SIMPLE_EMAIL_REGEX.test(options.alertTransport.emailFrom)) {
                        return reject(new Error('Invalid Alert Transport Email From'));
                    }
                    if (typeof options.alertTransport.emailFromName === 'undefined') {
                        options.alertTransport['emailFromName'] = '';
                    }
                    if (typeof options.alertTransport.emailsTo === 'undefined') {
                        return reject(new Error('Missing Alert Transport Mailgun Emails To'));
                    }
                    // If emailsTo Property was String, convert it to Array
                    if (typeof options.alertTransport.emailsTo === 'string') {
                        options.alertTransport.emailsTo = [options.alertTransport.emailsTo];
                    }
                    if (options.alertTransport.emailsTo.length == 0) {
                        return reject(new Error('Invalid Alert Transport Emails To cannot be Empty'));
                    }
                    // Validate Email To Addresses
                    for (let emailTo of options.alertTransport.emailsTo) {
                        if (!SIMPLE_EMAIL_REGEX.test(emailTo)) {
                            return reject(new Error(util.format('Invalid Alert Transport Email To, %s', emailTo)));
                        }
                    }
                    alertTransport = options.alertTransport;
                    break;
                default:
            }
        }
        return resolve(alertTransport);
    });
}

// Get Alert Days Before Expiry from Constructor
function getAlertDaysBeforeExpiry(options) {
    return new Promise((resolve, reject) => {
        // If Alert Days Before Expiry Option is Missing, Set Default as 30 Days
        if (typeof options.alertDaysBeforeExpiry === 'undefined') {
            options['alertDaysBeforeExpiry'] = 30;
        }
        let alertDaysBeforeExpiry = isNaN(parseInt(options.alertDaysBeforeExpiry, 10)) ? 30 : parseInt(options.alertDaysBeforeExpiry, 10);
        // If Alert Days Less than or Equal to Zero, Set it to 1 Day
        alertDaysBeforeExpiry = alertDaysBeforeExpiry <= 0 ? 1 : alertDaysBeforeExpiry;
        return resolve(alertDaysBeforeExpiry);
    });
}

// Retrieve SSL Certificate via TLS Connect
function getPeerCertificate(tlsOptions) {
    return new Promise((resolve, reject) => {
        let peerCertificate = null;
        const socket = tls.connect(tlsOptions, () => {
            peerCertificate = socket.getPeerCertificate();
            socket.destroy();
        });
        socket.on('error', err => {
            return reject(err);
        });
        socket.on('close', () => {
            return resolve(peerCertificate);
        });
    });
}

function shouldAlertSslExpiry(peerCertificate, alertDaysBeforeExpiry) {
    return new Promise((resolve, reject) => {
        // Check Valid From and Valid To Key Exist
        if (typeof peerCertificate.valid_from === 'undefined') {
            return reject(new Error('Invalid Peer Certificate'));
        }
        if (typeof peerCertificate.valid_to === 'undefined') {
            return reject(new Error('Invalid Peer Certificate'));
        }
        const dayInMs = (1000 * 60 * 60 * 24);
        let currentDateTime = new Date();
        let expiryStatus = false;
        let daysBeforeExpiry = -1;
        // Check the Cert Expiry or not first before Calculating Diff between Current Date and Certificate Valid To Date
        if (currentDateTime.getTime() > new Date(peerCertificate.valid_to).getTime()) {
            expiryStatus = true;
        } else {
            daysBeforeExpiry = Math.round((new Date(peerCertificate.valid_to).getTime() - currentDateTime.getTime()) / dayInMs);
            if (alertDaysBeforeExpiry >= daysBeforeExpiry) {
                expiryStatus = true;
            }
        }
        return resolve({
            daysExpireRemains: daysBeforeExpiry,
            expiryStatus: expiryStatus
        });
    });
}

// Process Send Alert, Determine which Transport Type and Send it out
function processSendAlert(alertSslExpiry, tlsOptions, alertTransport) {
    return new Promise(async (resolve, reject) => {
        try {
            let alertResponse = null;
            if (alertSslExpiry.expiryStatus) {
                // Prepare Alert Subject
                let alertSubject = util.format('[%s]SSL Certificate Expiry Alert', typeof tlsOptions.host !== 'undefined' ? tlsOptions.host : 'Unknown');
                // Prepare Alert Message Content
                let alertMessage = '';
                if (alertSslExpiry.daysExpireRemains == -1) {
                    alertMessage = util.format('Your Domain [%s] SSL Certificate was Expired, please update it asap.', typeof tlsOptions.host !== 'undefined' ? tlsOptions.host : 'Unknown');
                } else if (alertSslExpiry.daysExpireRemains > -1) {
                    alertMessage = util.format('Your Domain [%s] SSL Certificate was nearly to Expire, please update it asap. Days Remaining: %d Day(s)', typeof tlsOptions.host !== 'undefined' ? tlsOptions.host : 'Unknown', alertSslExpiry.daysExpireRemains);
                }
                switch (alertTransport.name) {
                    case 'mailgun':
                        alertResponse = await sendAlertByMailgun(alertTransport, alertSubject, alertMessage);
                        break;
                    default:
                }
            }
            return resolve(alertResponse);
        } catch (err) {
            return reject(err);
        }
    });
}

function sendAlertByMailgun(alertTransport, alertSubject, alertMessage) {
    return new Promise(async (resolve, reject) => {
        let alertStatus = false;
        let alertResult = null;
        try {
            let emailFrom = alertTransport.emailFrom;
            if (alertTransport.emailFromName.trim() != '') {
                emailFrom = util.format('%s <%s>', alertTransport.emailFromName, emailFrom);
            }
            const mg = mailgun.client({ username: 'api', key: alertTransport.apiKey });
            const message = await mg.messages.create(alertTransport.domain, {
                from: emailFrom,
                to: alertTransport.emailsTo,
                subject: alertSubject,
                text: alertMessage,
                html: alertMessage
            });
            alertStatus = true;
            alertResult = message;
        } catch (err) {
            alertResult = err.message;
        }
        return resolve({
            alertStatus: alertStatus,
            alertResult: alertResult
        });
    });
}

module.exports = async (options) => {
    let tlsOptions = null;
    let alertTransport = null;
    let alertDaysBeforeExpiry = null;
    let alertSslExpiry = null;
    // Options Checking
    try {
        tlsOptions = await getTlsOptions(options);
        alertTransport = await getAlertTransport(options);
        alertDaysBeforeExpiry = await getAlertDaysBeforeExpiry(options);
    } catch (err) {
        throw err;
    }
    // Checking the SSL Certificate for the Doamin
    try {
        const peerCertificate = await getPeerCertificate(tlsOptions);
        alertSslExpiry = await shouldAlertSslExpiry(peerCertificate, alertDaysBeforeExpiry);
    } catch (err) {
        throw err;
    }
    // Process Send Alert via Transport Type
    try {
        if (alertTransport && alertSslExpiry != null) {
            const alertResponse = await processSendAlert(alertSslExpiry, tlsOptions, alertTransport);
            if (alertResponse != null) {
                alertSslExpiry = Object.assign({}, alertSslExpiry, alertResponse);
            }
        }
        return alertSslExpiry;
    } catch (err) {
        throw err;
    }
};