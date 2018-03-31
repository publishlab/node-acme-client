<a name="AcmeClient"></a>

## AcmeClient
AcmeClient

**Kind**: global class  

* [AcmeClient](#AcmeClient)
    * [new AcmeClient(opts)](#new_AcmeClient_new)
    * [.registerAccount([data])](#AcmeClient+registerAccount) ⇒ <code>Promise</code>
    * [.updateAccount([data])](#AcmeClient+updateAccount) ⇒ <code>Promise</code>
    * [.changeAccountKey(newAccountKey, [data])](#AcmeClient+changeAccountKey) ⇒ <code>Promise</code>
    * [.registerDomain(data)](#AcmeClient+registerDomain) ⇒ <code>Promise</code>
    * [.getChallengeKeyAuthorization(challenge)](#AcmeClient+getChallengeKeyAuthorization) ⇒ <code>Promise</code>
    * [.completeChallenge(challenge)](#AcmeClient+completeChallenge) ⇒ <code>Promise</code>
    * [.verifyChallengeBaseUri(baseUri, challenge)](#AcmeClient+verifyChallengeBaseUri) ⇒ <code>Promise</code>
    * [.waitForChallengeValidStatus(challenge)](#AcmeClient+waitForChallengeValidStatus) ⇒ <code>Promise</code>
    * [.getCertificateChain(csr, [data])](#AcmeClient+getCertificateChain) ⇒ <code>Promise</code>
    * [.revokeCertificate(cert, [data])](#AcmeClient+revokeCertificate) ⇒ <code>Promise</code>
    * [.easy(opts)](#AcmeClient+easy) ⇒ <code>Promise</code>

<a name="new_AcmeClient_new"></a>

### new AcmeClient(opts)

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | ACME client options |
| opts.directoryUri | <code>string</code> |  |
| opts.accountKey | <code>buffer</code> \| <code>string</code> |  |
| [opts.acceptTermsOfService] | <code>boolean</code> | default: `false` |
| [opts.backoffMin] | <code>number</code> | default: `5000` |
| [opts.backoffMax] | <code>number</code> | default: `30000` |
| [opts.backoffAttempts] | <code>number</code> | default: `5` |

<a name="AcmeClient+registerAccount"></a>

### acmeClient.registerAccount([data]) ⇒ <code>Promise</code>
Register new account

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-creation

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise</code> - account  

| Param | Type | Description |
| --- | --- | --- |
| [data] | <code>object</code> | Request data |

<a name="AcmeClient+updateAccount"></a>

### acmeClient.updateAccount([data]) ⇒ <code>Promise</code>
Update existing account

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-update

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise</code> - account  

| Param | Type | Description |
| --- | --- | --- |
| [data] | <code>object</code> | Request data |

<a name="AcmeClient+changeAccountKey"></a>

### acmeClient.changeAccountKey(newAccountKey, [data]) ⇒ <code>Promise</code>
Change account private key

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-key-roll-over

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise</code> - account  

| Param | Type | Description |
| --- | --- | --- |
| newAccountKey | <code>buffer</code> \| <code>string</code> | New PEM encoded private key |
| [data] | <code>object</code> | Additional request data |

<a name="AcmeClient+registerDomain"></a>

### acmeClient.registerDomain(data) ⇒ <code>Promise</code>
Register a new domain

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#pre-authorization

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise</code> - domain  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | Request data |

<a name="AcmeClient+getChallengeKeyAuthorization"></a>

### acmeClient.getChallengeKeyAuthorization(challenge) ⇒ <code>Promise</code>
Get key authorization for ACME challenge

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#key-authorizations

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise</code> - keyAuthorization  

| Param | Type | Description |
| --- | --- | --- |
| challenge | <code>object</code> | Challenge object returned by API |

<a name="AcmeClient+completeChallenge"></a>

### acmeClient.completeChallenge(challenge) ⇒ <code>Promise</code>
Notify provider that challenge has been completed

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#responding-to-challenges

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise</code> - challenge  

| Param | Type | Description |
| --- | --- | --- |
| challenge | <code>object</code> | Challenge object returned by API |

<a name="AcmeClient+verifyChallengeBaseUri"></a>

### acmeClient.verifyChallengeBaseUri(baseUri, challenge) ⇒ <code>Promise</code>
Verify that ACME challenge is satisfied on base URI

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  

| Param | Type | Description |
| --- | --- | --- |
| baseUri | <code>string</code> | Base URI |
| challenge | <code>object</code> | Challenge object returned by API |

<a name="AcmeClient+waitForChallengeValidStatus"></a>

### acmeClient.waitForChallengeValidStatus(challenge) ⇒ <code>Promise</code>
Wait for ACME provider to verify challenge status

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise</code> - challenge  

| Param | Type | Description |
| --- | --- | --- |
| challenge | <code>object</code> | Challenge object returned by API |

<a name="AcmeClient+getCertificateChain"></a>

### acmeClient.getCertificateChain(csr, [data]) ⇒ <code>Promise</code>
Get chain of certificates

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#downloading-the-certificate

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise</code> - {certificate, intermediate, chain}  

| Param | Type | Description |
| --- | --- | --- |
| csr | <code>buffer</code> \| <code>string</code> | PEM encoded Certificate Signing Request |
| [data] | <code>object</code> | Additional request data |

<a name="AcmeClient+revokeCertificate"></a>

### acmeClient.revokeCertificate(cert, [data]) ⇒ <code>Promise</code>
Revoke certificate

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#certificate-revocation

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise</code> - certificate  

| Param | Type | Description |
| --- | --- | --- |
| cert | <code>buffer</code> \| <code>string</code> | PEM encoded certificate |
| [data] | <code>object</code> | Additional request data |

<a name="AcmeClient+easy"></a>

### acmeClient.easy(opts) ⇒ <code>Promise</code>
Easy mode

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise</code> - {certificate, intermediate, chain}  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | Options |
| opts.csr | <code>buffer</code> \| <code>string</code> | Certificate Signing Request |
| opts.challengeCreateFn | <code>function</code> | Function to trigger before completing ACME challenge |
| opts.challengeRemoveFn | <code>function</code> | Function to trigger after completing ACME challenge |
| [opts.email] | <code>string</code> | Account email address |
| [opts.challengeType] | <code>string</code> | Wanted ACME challenge type, default: `http-01` |

