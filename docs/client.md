<a name="AcmeClient"></a>

## AcmeClient
**Kind**: global class  

* [AcmeClient](#AcmeClient)
    * [new AcmeClient(opts)](#new_AcmeClient_new)
    * [.registerAccount([data], callback)](#AcmeClient+registerAccount)
    * [.updateAccount([data], callback)](#AcmeClient+updateAccount)
    * [.changeAccountKey(newAccountKey, [data], callback)](#AcmeClient+changeAccountKey)
    * [.registerDomain(data, callback)](#AcmeClient+registerDomain)
    * [.getChallengeKeyAuthorization(challenge, callback)](#AcmeClient+getChallengeKeyAuthorization)
    * [.completeChallenge(challenge, callback)](#AcmeClient+completeChallenge)
    * [.verifyChallengeBaseUri(baseUri, challenge, callback)](#AcmeClient+verifyChallengeBaseUri)
    * [.waitForChallengeValidStatus(challenge, callback)](#AcmeClient+waitForChallengeValidStatus)
    * [.getCertificateChain(csr, [data], callback)](#AcmeClient+getCertificateChain)
    * [.revokeCertificate(cert, [data], callback)](#AcmeClient+revokeCertificate)
    * [.easy(opts, callback)](#AcmeClient+easy)

<a name="new_AcmeClient_new"></a>

### new AcmeClient(opts)
AcmeClient


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | ACME client options |
| opts.directoryUri | <code>string</code> |  |
| opts.accountKey | <code>buffer</code> \| <code>string</code> |  |
| [opts.acceptTermsOfService] | <code>boolean</code> | default: `false` |
| [opts.waitForChallengeSettings] | <code>object</code> |  |
| [opts.waitForChallengeSettings.times] | <code>number</code> | default: `5` |
| [opts.waitForChallengeSettings.interval] | <code>number</code> | default: `5000` |

<a name="AcmeClient+registerAccount"></a>

### acmeClient.registerAccount([data], callback)
Register new account

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-creation

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  

| Param | Type | Description |
| --- | --- | --- |
| [data] | <code>object</code> | Request data |
| callback | <code>function</code> | `{string}` err, `{object}` account |

<a name="AcmeClient+updateAccount"></a>

### acmeClient.updateAccount([data], callback)
Update existing account

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-update

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  

| Param | Type | Description |
| --- | --- | --- |
| [data] | <code>object</code> | Request data |
| callback | <code>function</code> | `{string}` err, `{object}` account |

<a name="AcmeClient+changeAccountKey"></a>

### acmeClient.changeAccountKey(newAccountKey, [data], callback)
Change account private key

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-key-roll-over

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  

| Param | Type | Description |
| --- | --- | --- |
| newAccountKey | <code>buffer</code> \| <code>string</code> | New PEM encoded private key |
| [data] | <code>object</code> | Additional request data |
| callback | <code>function</code> | `{string}` err, `{object}` account |

<a name="AcmeClient+registerDomain"></a>

### acmeClient.registerDomain(data, callback)
Register a new domain

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#pre-authorization

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | Request data |
| callback | <code>function</code> | `{string}` err, `{object}` domain |

<a name="AcmeClient+getChallengeKeyAuthorization"></a>

### acmeClient.getChallengeKeyAuthorization(challenge, callback)
Get key authorization for ACME challenge

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#key-authorizations

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  

| Param | Type | Description |
| --- | --- | --- |
| challenge | <code>object</code> | Challenge object returned by API |
| callback | <code>function</code> | `{string}` err, `{string}` keyAuthorization |

<a name="AcmeClient+completeChallenge"></a>

### acmeClient.completeChallenge(challenge, callback)
Notify provider that challenge has been completed

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#responding-to-challenges

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  

| Param | Type | Description |
| --- | --- | --- |
| challenge | <code>object</code> | Challenge object returned by API |
| callback | <code>function</code> | `{string}` err, `{object}` challenge |

<a name="AcmeClient+verifyChallengeBaseUri"></a>

### acmeClient.verifyChallengeBaseUri(baseUri, challenge, callback)
Verify that ACME challenge is satisfied on base URI

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  

| Param | Type | Description |
| --- | --- | --- |
| baseUri | <code>string</code> | Base URI |
| challenge | <code>object</code> | Challenge object returned by API |
| callback | <code>function</code> | `{string}` err |

<a name="AcmeClient+waitForChallengeValidStatus"></a>

### acmeClient.waitForChallengeValidStatus(challenge, callback)
Wait for ACME provider to verify challenge status

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  

| Param | Type | Description |
| --- | --- | --- |
| challenge | <code>object</code> | Challenge object returned by API |
| callback | <code>function</code> | `{string}` err, `{object}` challenge |

<a name="AcmeClient+getCertificateChain"></a>

### acmeClient.getCertificateChain(csr, [data], callback)
Get chain of certificates

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#downloading-the-certificate

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  

| Param | Type | Description |
| --- | --- | --- |
| csr | <code>buffer</code> \| <code>string</code> | PEM encoded Certificate Signing Request |
| [data] | <code>object</code> | Additional request data |
| callback | <code>function</code> | `{string}` err, `{object}` {certificate, intermediate, chain} |

<a name="AcmeClient+revokeCertificate"></a>

### acmeClient.revokeCertificate(cert, [data], callback)
Revoke certificate

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#certificate-revocation

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  

| Param | Type | Description |
| --- | --- | --- |
| cert | <code>buffer</code> \| <code>string</code> | PEM encoded certificate |
| [data] | <code>object</code> | Additional request data |
| callback | <code>function</code> | `{string}` err |

<a name="AcmeClient+easy"></a>

### acmeClient.easy(opts, callback)
Easy mode

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | Options |
| opts.csr | <code>buffer</code> \| <code>string</code> | Certificate Signing Request |
| opts.challengeCreateFn | <code>function</code> | Function to trigger before completing ACME challenge |
| opts.challengeRemoveFn | <code>function</code> | Function to trigger after completing ACME challenge |
| [opts.email] | <code>string</code> | Account email address |
| [opts.challengeType] | <code>string</code> | Wanted ACME challenge type, default: `http-01` |
| callback | <code>function</code> | `{string}` err, `{object}` {certificate, intermediate, chain} |

