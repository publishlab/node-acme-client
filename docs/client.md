<a name="AcmeClient"></a>

## AcmeClient
AcmeClient

**Kind**: global class  

* [AcmeClient](#AcmeClient)
    * [new AcmeClient(opts)](#new_AcmeClient_new)
    * [.getTermsOfServiceUrl()](#AcmeClient+getTermsOfServiceUrl) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.createAccount([data])](#AcmeClient+createAccount) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.updateAccount([data])](#AcmeClient+updateAccount) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.updateAccountKey(newAccountKey, [data])](#AcmeClient+updateAccountKey) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.createOrder(data)](#AcmeClient+createOrder) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.finalizeOrder(order, csr)](#AcmeClient+finalizeOrder) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.getAuthorizations(order)](#AcmeClient+getAuthorizations) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
    * [.deactivateAuthorization(authz)](#AcmeClient+deactivateAuthorization) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.getChallengeKeyAuthorization(challenge)](#AcmeClient+getChallengeKeyAuthorization) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.verifyChallenge(authz, challenge)](#AcmeClient+verifyChallenge) ⇒ <code>Promise</code>
    * [.completeChallenge(challenge)](#AcmeClient+completeChallenge) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.waitForValidStatus(item)](#AcmeClient+waitForValidStatus) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.getCertificate(order)](#AcmeClient+getCertificate) ⇒ <code>Promise.&lt;buffer&gt;</code>
    * [.revokeCertificate(cert, [data])](#AcmeClient+revokeCertificate) ⇒ <code>Promise</code>
    * [.auto(opts)](#AcmeClient+auto) ⇒ <code>Promise.&lt;buffer&gt;</code>

<a name="new_AcmeClient_new"></a>

### new AcmeClient(opts)

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> |  |
| opts.directoryUrl | <code>string</code> | ACME directory URL |
| opts.accountKey | <code>buffer</code> \| <code>string</code> | PEM encoded account private key |
| [opts.backoffAttempts] | <code>number</code> | Maximum number of backoff attempts, default: `5` |
| [opts.backoffMin] | <code>number</code> | Minimum backoff attempt delay in milliseconds, default: `5000` |
| [opts.backoffMax] | <code>number</code> | Maximum backoff attempt delay in milliseconds, default: `30000` |

<a name="AcmeClient+getTermsOfServiceUrl"></a>

### acmeClient.getTermsOfServiceUrl() ⇒ <code>Promise.&lt;string&gt;</code>
Get Terms of Service URL

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise.&lt;string&gt;</code> - ToS URL  
<a name="AcmeClient+createAccount"></a>

### acmeClient.createAccount([data]) ⇒ <code>Promise.&lt;object&gt;</code>
Create a new account

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-creation

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Account  

| Param | Type | Description |
| --- | --- | --- |
| [data] | <code>object</code> | Request data |

<a name="AcmeClient+updateAccount"></a>

### acmeClient.updateAccount([data]) ⇒ <code>Promise.&lt;object&gt;</code>
Update existing account

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-update

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Account  

| Param | Type | Description |
| --- | --- | --- |
| [data] | <code>object</code> | Request data |

<a name="AcmeClient+updateAccountKey"></a>

### acmeClient.updateAccountKey(newAccountKey, [data]) ⇒ <code>Promise.&lt;object&gt;</code>
Update account private key

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-key-roll-over

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Account  

| Param | Type | Description |
| --- | --- | --- |
| newAccountKey | <code>buffer</code> \| <code>string</code> | New PEM encoded private key |
| [data] | <code>object</code> | Additional request data |

<a name="AcmeClient+createOrder"></a>

### acmeClient.createOrder(data) ⇒ <code>Promise.&lt;object&gt;</code>
Create a new order

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#applying-for-certificate-issuance

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Order  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | Request data |

<a name="AcmeClient+finalizeOrder"></a>

### acmeClient.finalizeOrder(order, csr) ⇒ <code>Promise.&lt;object&gt;</code>
Finalize order

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#applying-for-certificate-issuance

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Order  

| Param | Type | Description |
| --- | --- | --- |
| order | <code>object</code> | Order object |
| csr | <code>buffer</code> \| <code>string</code> | PEM encoded Certificate Signing Request |

<a name="AcmeClient+getAuthorizations"></a>

### acmeClient.getAuthorizations(order) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Get identifier authorizations from order

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#identifier-authorization

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - Authorizations  

| Param | Type | Description |
| --- | --- | --- |
| order | <code>object</code> | Order |

<a name="AcmeClient+deactivateAuthorization"></a>

### acmeClient.deactivateAuthorization(authz) ⇒ <code>Promise.&lt;object&gt;</code>
Deactivate identifier authorization

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#deactivating-an-authorization

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Authorization  

| Param | Type | Description |
| --- | --- | --- |
| authz | <code>object</code> | Identifier authorization |

<a name="AcmeClient+getChallengeKeyAuthorization"></a>

### acmeClient.getChallengeKeyAuthorization(challenge) ⇒ <code>Promise.&lt;string&gt;</code>
Get key authorization for ACME challenge

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#key-authorizations

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise.&lt;string&gt;</code> - Key authorization  

| Param | Type | Description |
| --- | --- | --- |
| challenge | <code>object</code> | Challenge object returned by API |

<a name="AcmeClient+verifyChallenge"></a>

### acmeClient.verifyChallenge(authz, challenge) ⇒ <code>Promise</code>
Verify that ACME challenge is satisfied

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  

| Param | Type | Description |
| --- | --- | --- |
| authz | <code>object</code> | Identifier authorization |
| challenge | <code>object</code> | Authorization challenge |

<a name="AcmeClient+completeChallenge"></a>

### acmeClient.completeChallenge(challenge) ⇒ <code>Promise.&lt;object&gt;</code>
Notify provider that challenge has been completed

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#responding-to-challenges

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Challenge  

| Param | Type | Description |
| --- | --- | --- |
| challenge | <code>object</code> | Challenge object returned by API |

<a name="AcmeClient+waitForValidStatus"></a>

### acmeClient.waitForValidStatus(item) ⇒ <code>Promise.&lt;object&gt;</code>
Wait for ACME provider to verify status on a order, authorization or challenge

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#responding-to-challenges

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Valid order, authorization or challenge  

| Param | Type | Description |
| --- | --- | --- |
| item | <code>object</code> | An order, authorization or challenge object |

<a name="AcmeClient+getCertificate"></a>

### acmeClient.getCertificate(order) ⇒ <code>Promise.&lt;buffer&gt;</code>
Get certificate from ACME order

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#downloading-the-certificate

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise.&lt;buffer&gt;</code> - Certificate  

| Param | Type | Description |
| --- | --- | --- |
| order | <code>object</code> | Order object |

<a name="AcmeClient+revokeCertificate"></a>

### acmeClient.revokeCertificate(cert, [data]) ⇒ <code>Promise</code>
Revoke certificate

https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#certificate-revocation

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  

| Param | Type | Description |
| --- | --- | --- |
| cert | <code>buffer</code> \| <code>string</code> | PEM encoded certificate |
| [data] | <code>object</code> | Additional request data |

<a name="AcmeClient+auto"></a>

### acmeClient.auto(opts) ⇒ <code>Promise.&lt;buffer&gt;</code>
Auto mode

**Kind**: instance method of [<code>AcmeClient</code>](#AcmeClient)  
**Returns**: <code>Promise.&lt;buffer&gt;</code> - Certificate  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> |  |
| opts.csr | <code>buffer</code> \| <code>string</code> | Certificate Signing Request |
| opts.challengeCreateFn | <code>function</code> | Function returning Promise triggered before completing ACME challenge |
| opts.challengeRemoveFn | <code>function</code> | Function returning Promise triggered after completing ACME challenge |
| [opts.email] | <code>string</code> | Account email address |
| [opts.termsOfServiceAgreed] | <code>boolean</code> | Agree to Terms of Service, default: `false` |
| [opts.challengePriority] | <code>Array.&lt;string&gt;</code> | Array defining challenge type priority, default: `['http-01', 'dns-01']` |

