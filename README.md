acme-client
===========


*A simple and unopinionated ACME client.*

[![Build Status](https://travis-ci.org/publishlab/node-acme-client.svg?branch=master)](https://travis-ci.org/publishlab/node-acme-client)

This module is written to handle communication with a Boulder/Let's Encrypt-style ACME API.
If you are looking for an all-in-one solution with features like

* Storage of keys, certificates and metadata
* Automatic renewal of certificates
* Built-in challenge response and web-server configuration

...this library is not for you.

For more information on how the Boulder/Let's Encrypt API diverges from the ACME specification see:
[https://github.com/letsencrypt/boulder/blob/master/docs/acme-divergences.md](https://github.com/letsencrypt/boulder/blob/master/docs/acme-divergences.md)



Installation
------------

`acme-client` requires OpenSSL to be installed.

```bash
$ npm install acme-client
```



Usage
-----

```js
var acme = require('acme-client');

var accountPrivateKey = '<PEM encoded private key>';

var client = new acme.Client({
    directoryUri: acme.directory.letsencrypt.staging,
    accountKey: accountPrivateKey,
    acceptTermsOfService: true
});
```


#### Directory URIs

```js
acme.directory.letsencrypt.staging;
acme.directory.letsencrypt.production;
```



Easy mode
---------

For convenience an `easy` method is included in the client that takes a single config object.
This method will handle the entire process of getting a certificate for one or multiple domains.

Documentation at [docs/client.md#AcmeClient+easy](docs/client.md#AcmeClient+easy).

A full example can be found at [examples/easy.js](examples/easy.js).


#### Example

```js
var easyConfig = {
    csr: '<PEM encoded CSR>',
    email: 'test@example.com',
    challengeCreateFn: function(keyAuthorization, challenge, domain, callback) { },
    challengeRemoveFn: function(challenge, domain, callback) { }
};

client.easy(easyConfig, function(err, data) {
    var certificate = data.certificate;
    var intermediate = data.intermediate;
    var chain = data.chain;
});
```



OpenSSL utils
-------------

Some OpenSSL utility methods are included for creating keys and Certificate Signing Requests, exposed through `acme.openssl`.

Documentation at [docs/openssl.md](docs/openssl.md).


#### Creating a Certificate Signing Request.

```js
var csrConfig = {
    commonName: 'localhost',
    country: 'GB',
    state: 'Test State or Province',
    locality: 'Test Locality',
    organization: 'Organization Name',
    organizationUnit: 'Organizational Unit Name',
    emailAddress: 'test@email.address'
};

acme.openssl.createCsr(csrConfig, function(err, result) {
    var csr = result.csr;
    var key = result.key;
});
```


#### Creating a 4096 bit private key

```js
acme.openssl.createPrivateKey(4096, function(err, key) { });
```



API
---

For more fine-grained control you can interact with the ACME API using the methods documented below.

Documentation at [docs/client.md](docs/client.md).


#### Registering an account

```js
var data = {
    contact: ['mailto: test@email.address']
};

client.registerAccount(data, function(err, account) { });
```


#### Registering a domain for authorization

```js
var data = {
    identifier: {
        type: 'dns',
        value: 'example.net'
    }
};

client.registerDomain(data, function(err, domain) {
    var challenges = domain.challenges;
});
```



Debugging
---------

`acme-client` uses [debug](https://www.npmjs.com/package/debug) for debugging which can be enabled by running

```bash
DEBUG=acme-client node file.js
```



License
-------

[MIT](LICENSE)
