**Notice:** [On November 1st, 2020 Let's Encrypt will remove support for unauthenticated GETs from the v2 API](https://community.letsencrypt.org/t/acme-v2-scheduled-deprecation-of-unauthenticated-resource-gets/74380). Please update to `acme-client >= v3.2.0` or `>= v2.3.1` before this date to avoid being affected by this API change.


## v3.2.2

* `added` TypeScript definitions


## v3.2.1 (2019-11-14)

* `added` New option `skipChallengeVerification` added to `auto()` to bypass internal challenge verification


## v3.2.0 (2019-08-26)

* `added` More extensive testing using [letsencrypt/pebble](https://github.com/letsencrypt/pebble)
* `changed` When creating a CSR, `commonName` no longer defaults to `'localhost'`
    - This change is not considered breaking since `commonName: 'localhost'` will result in an error when ordering a certificate
* `fixed` Retry signed API requests on `urn:ietf:params:acme:error:badNonce` - [RFC 8555 Section 6.5](https://tools.ietf.org/html/rfc8555#section-6.5)
* `fixed` Minor bugs related to `POST-as-GET` when calling `updateAccount()`
* `fixed` Ensure subject common name is present in SAN when creating a CSR - [CAB v1.2.3 Section 9.2.2](https://cabforum.org/wp-content/uploads/BRv1.2.3.pdf)
* `fixed` Send empty JSON body when responding to challenges - [RFC 8555 Section 7.5.1](https://tools.ietf.org/html/rfc8555#section-7.5.1)


## v2.3.1 (2019-08-26)

* `backport` Minor bugs related to `POST-as-GET` when calling `updateAccount()`
* `backport` Send empty JSON body when responding to challenges


## v3.1.0 (2019-08-21)

* `added` UTF-8 support when generating a CSR subject using forge - [RFC 5280](https://tools.ietf.org/html/rfc5280)
* `fixed` Implemented `POST-as-GET` for all ACME API requests - [RFC 8555 Section 6.3](https://tools.ietf.org/html/rfc8555#section-6.3)


## v2.3.0 (2019-08-21)

* `backport` Implemented `POST-as-GET` for all ACME API requests


## v3.0.0 (2019-07-13)

* `added` Expose `axios` instance to allow manipulating HTTP client defaults
* `breaking` Remove support for Node v4 and v6
* `breaking` Remove Babel transpilation


## v2.2.3 (2019-01-25)

* `added` DNS CNAME detection when verifying `dns-01` challenges


## v2.2.2 (2019-01-07)

* `added` Support for `tls-alpn-01` challenge key authorization


## v2.2.1 (2019-01-04)

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
