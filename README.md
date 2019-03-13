# Node SSL Certificate Expiry Alert

> Provide ways to alert if SSL Certificate for the HTTPS Host nearly to the Expiry Period.

Supported Ways:
- Mailgun (https://www.mailgun.com/ / https://github.com/mailgun/mailgun-js)

## Prerequisite
Node.js 8.x or Later

## Usage

```js
const nodeSslExpiryAlert = require('node-ssl-expiry-alert');
(async () => {
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
})();
```

## Options

#### hosts

Type: String

Host Name

#### port

Type: Integer

Port Number

#### alertDaysBeforeExpiry

Type: Integer

Invoke the Alert to the Transport Defined when the Days Defined less than or equal compared with the 'valid_to' from the SSL Certificate

#### alertTransport

Type: Object

Define Transport for Sending out the Expiry Alert

##### name

Type: String

Available Transport: mailgun (https://www.mailgun.com/)

##### domain

Type: String

Define the Domain Name for the 'Email From' which required for the Transport

Compulsory for Transport: mailgun

##### apiKey

Type: String

Define the API Key which required for the Transport

Compulsory for Transport: mailgun

##### emailFrom

Type: String

Define the Email From Address which required for the Transport

Compulsory for Transport: mailgun

##### emailFromName

Type: String

Define the Email From Name to enhance the Human Readability for the Email From Address

##### emailsTo

Type: Array or String

Define the Email To Addresses for whom receive the Expiry Alert

Compulsory for Transport: mailgun

#### License

MIT