## v2.2.1 `next`

* `fixed` Handle and throw errors from OpenSSL process


## v2.2.0 (2018-11-06)

* `added` New [node-forge](https://www.npmjs.com/package/node-forge) crypto engine, removes OpenSSL CLI dependency
* `added` Support native `crypto.generateKeyPair()` API when generating key pairs


## v2.1.0 (2018-10-21)

* `added` Ability to set and get current account URL
* `fixed` Replace HTTP client `request` with `axios`
* `fixed` Auto-mode no longer tries to create account when account URL exists


## v2.0.1 (2018-08-17)

* `fixed` Key rollover in compliance with [draft-ietf-acme-13](https://tools.ietf.org/html/draft-ietf-acme-acme-13)


## v2.0.0 (2018-04-02)

* `breaking` ACMEv2
* `breaking` API changes
* `breaking` Rewrite to ES6
* `breaking` Promises instead of callbacks


## v1.0.0 (2017-10-20)

* API stable


## v0.2.1 (2017-09-27)

* `fixed` Bug causing invalid anti-replay nonce


## v0.2.0 (2017-09-21)

* `breaking` OpenSSL method `readCsrDomains` and `readCertificateInfo` now return domains as an object
* `fixed` Added and fixed some tests


## v0.1.0 (2017-09-14)

* `acme-client` released
