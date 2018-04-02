# acme-client [![Build Status](https://travis-ci.org/publishlab/node-acme-client.svg?branch=master)](https://travis-ci.org/publishlab/node-acme-client)


*A simple and unopinionated ACME client.*

This module is written to handle communication with a Boulder/Let's Encrypt-style ACME API.

ACME specification: [https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md](https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md)

Information on how the Boulder/Let's Encrypt API diverges from the ACME spec:
[https://github.com/letsencrypt/boulder/blob/master/docs/acme-divergences.md](https://github.com/letsencrypt/boulder/blob/master/docs/acme-divergences.md)


### ACME compatibility

| acme-client   | API       | Style     |
| ------------- | --------- | --------- |
| v2.x          | ACMEv2    | Promise   |
| v1.x          | ACMEv1    | callback  |



## Installation

`acme-client` requires OpenSSL to be installed and available in `$PATH`.

```bash
$ npm install acme-client
$ openssl version
```



## Usage

```js
const acme = require('acme-client');

const accountPrivateKey = '<PEM encoded private key>';

const client = new acme.Client({
    directoryUrl: acme.directory.letsencrypt.staging,
    accountKey: accountPrivateKey
});
```


### Directory URLs

```js
acme.directory.letsencrypt.staging;
acme.directory.letsencrypt.production;
```



## Auto mode

For convenience an `auto()` method is included in the client that takes a single config object.
This method will handle the entire process of getting a certificate for one or multiple domains.

A full example can be found at [examples/auto.js](examples/auto.js).

__Documentation: [docs/client.md#AcmeClient+auto](docs/client.md#AcmeClient+auto)__


### Example

```js
const autoOpts = {
    csr: '<PEM encoded CSR>',
    email: 'test@example.com',
    termsOfServiceAgreed: true,
    challengeCreateFn: async (authz, challenge, keyAuthorization) => {},
    challengeRemoveFn: async (authz, challenge, keyAuthorization) => {}
}

const certificate = await client.auto(autoOpts);
```



## OpenSSL utils

Some OpenSSL utility methods are included for creating keys and Certificate Signing Requests, exposed through `acme.openssl`.

__Documentation: [docs/openssl.md](docs/openssl.md)__


### Example

```js
const privateKey = await acme.openssl.createPrivateKey();

const [certificateKey, certificateCsr] = await acme.openssl.createCsr({
    commonName: '*.example.com',
    altNames: ['example.com']
})
```



## API

For more fine-grained control you can interact with the ACME API using the methods documented below.

A full example can be found at [examples/api.js](examples/api.js).

__Documentation: [docs/client.md](docs/client.md)__


### Example

```js
const account = await client.createAccount({
    termsOfServiceAgreed: true,
    contact: ['mailto:test@example.com']
});

const order = await client.createOrder({
    identifiers: [
        { type: 'dns', value: 'example.com' },
        { type: 'dns', value: '*.example.com' }
    ]
});
```



## Debugging

`acme-client` uses [debug](https://www.npmjs.com/package/debug) for debugging which can be enabled by running

```bash
DEBUG=acme-client node index.js
```



## License

[MIT](LICENSE)
