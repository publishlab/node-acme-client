# acme-client [![CircleCI](https://circleci.com/gh/publishlab/node-acme-client.svg?style=svg)](https://circleci.com/gh/publishlab/node-acme-client)

*A simple and unopinionated ACME client.*

This module is written to handle communication with a Boulder/Let's Encrypt-style ACME API.

ACME specification: [https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md](https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md)

Information on how the Boulder/Let's Encrypt API diverges from the ACME spec:
[https://github.com/letsencrypt/boulder/blob/master/docs/acme-divergences.md](https://github.com/letsencrypt/boulder/blob/master/docs/acme-divergences.md)


### ACME compatibility

| acme-client   | API       | Style     |
| ------------- | --------- | --------- |
| >= v2.x       | ACMEv2    | Promise   |
| == v1.x       | ACMEv1    | callback  |

**Notice: [On November 1st, 2019 Let's Encrypt will remove support for unauthenticated GETs from the v2 API](https://community.letsencrypt.org/t/acme-v2-scheduled-deprecation-of-unauthenticated-resource-gets/74380). Please update to `acme-client >= v3.1.0` or `>= v2.3.0` before this date to avoid being affected by this API change.**


## Installation

```bash
$ npm install acme-client
```

**With the release of `acme-client v3.*` Node v4 and v6 are no longer supported.**


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


## Cryptography

For key pair generation and Certificate Signing Requests, `acme-client` supports multiple interchangeable cryptographic engines.


### `acme.forge` -- [docs/forge.md](docs/forge.md)

*Recommended when `node >= v10.12.0` or OpenSSL CLI dependency can not be met.*

Uses [node-forge](https://www.npmjs.com/package/node-forge), a pure JavaScript implementation of the TLS protocol.

This engine has no external dependencies since it is completely implemented in JavaScript, however CPU-intensive tasks (like generating a large size key pair) has a performance penalty and will be slower than doing it natively.

This caveat is removed in Node v10.12.0 with the introduction of [crypto.generateKeyPair()](https://nodejs.org/api/crypto.html#crypto_crypto_generatekeypair_type_options_callback), a native Node API for key pair generation. The forge engine will automatically use this API when available.


#### Example

```js
const privateKey = await acme.forge.createPrivateKey();

const [certificateKey, certificateCsr] = await acme.forge.createCsr({
    commonName: '*.example.com',
    altNames: ['example.com']
})
```


### `acme.openssl` -- [docs/openssl.md](docs/openssl.md)

*Recommended when `node < v10.12.0` and OpenSSL CLI dependency can be met.*

Uses [openssl-wrapper](https://www.npmjs.com/package/openssl-wrapper) to execute commands using the OpenSSL CLI.

This engine requires OpenSSL to be installed and available in `$PATH`.


#### Example

```js
const privateKey = await acme.openssl.createPrivateKey();

const [certificateKey, certificateCsr] = await acme.openssl.createCsr({
    commonName: '*.example.com',
    altNames: ['example.com']
})
```


## Auto mode

For convenience an `auto()` method is included in the client that takes a single config object.
This method will handle the entire process of getting a certificate for one or multiple domains.

A full example can be found at [examples/auto.js](examples/auto.js).

__Documentation: [docs/client.md#AcmeClient+auto](docs/client.md#AcmeClient+auto)__


#### Example

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


## API

For more fine-grained control you can interact with the ACME API using the methods documented below.

A full example can be found at [examples/api.js](examples/api.js).

__Documentation: [docs/client.md](docs/client.md)__


#### Example

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


## HTTP defaults

This module uses [axios](https://github.com/axios/axios) when communicating with the ACME API, and exposes the instance through `.axios`.

Should you, for example, need to change the default axios configuration to route requests through an HTTP proxy, this can be achieved as follows:

```js
const acme = require('acme-client');

acme.axios.defaults.proxy = {
    host: '127.0.0.1',
    port: 9000
};
```

A complete list of axios options and documentation can be found at:

* [https://github.com/axios/axios#request-config](https://github.com/axios/axios#request-config)
* [https://github.com/axios/axios#custom-instance-defaults](https://github.com/axios/axios#custom-instance-defaults)


## Debugging

`acme-client` uses [debug](https://www.npmjs.com/package/debug) for debugging which can be enabled by running

```bash
DEBUG=acme-client node index.js
```


## License

[MIT](LICENSE)
