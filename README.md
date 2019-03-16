# Node SSL Certificate Expiry Alert

> Provide ways to alert if SSL Certificate for the HTTPS Host nearly to the Expiry Period.

Supported Ways:
- Mailgun (https://www.mailgun.com/ , https://github.com/mailgun/mailgun-js)

## Prerequisite
Node.js 8.x or Later

## Install (Global Package)

```
$ npm install -g node-ssl-expiry-alert
```

## Usage

```
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
```

#### Examples

Using Linux Distribution

```
# Run command at 0:00am 1st Day of Each Month
0 0 1 * * ssl-expiry-alert --host [Host] --transport mailgun --email-from [Email From] --emails-to [Email To] --mailgun-domain [Mailgun Domain] --mailgun-apikey [Mailgun API Key]
```

## Install (Import to your Application)

```
$ npm install node-ssl-expiry-alert
```

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

## Change Logs

1.1.0 (16 March 2019)

- Added Command Line way (Global Package) to invoke Alert Checking

1.0.0 (13 March 2019)

- Initial Release
- Email Alert via Mailgun


#### License

MIT