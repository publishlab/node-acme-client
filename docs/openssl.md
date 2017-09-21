## Functions

<dl>
<dt><a href="#createPrivateKey">createPrivateKey([size], callback)</a></dt>
<dd><p>Generate a private RSA key</p>
</dd>
<dt><a href="#createPublicKey">createPublicKey(key, callback)</a></dt>
<dd><p>Generate a public RSA key</p>
</dd>
<dt><a href="#getModulus">getModulus(key, callback)</a></dt>
<dd><p>Get modulus</p>
</dd>
<dt><a href="#getPublicExponent">getPublicExponent(key, callback)</a></dt>
<dd><p>Get public exponent</p>
</dd>
<dt><a href="#pem2der">pem2der(key, callback)</a></dt>
<dd><p>Convert PEM to DER encoding</p>
</dd>
<dt><a href="#der2pem">der2pem(action, key, [pubIn], callback)</a></dt>
<dd><p>Convert DER to PEM encoding</p>
</dd>
<dt><a href="#readCsrDomains">readCsrDomains(csr, callback)</a></dt>
<dd><p>Read domains from a Certificate Signing Request</p>
</dd>
<dt><a href="#readCertificateInfo">readCertificateInfo(cert, callback)</a></dt>
<dd><p>Read information from a certificate</p>
</dd>
<dt><a href="#createCsr">createCsr(data, [key], callback)</a></dt>
<dd><p>Create a Certificate Signing Request</p>
</dd>
</dl>

<a name="createPrivateKey"></a>

## createPrivateKey([size], callback)
Generate a private RSA key

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| [size] | <code>number</code> | Size of the key, default: `2048` |
| callback | <code>function</code> | `{string}` err, `{buffer}` key |

<a name="createPublicKey"></a>

## createPublicKey(key, callback)
Generate a public RSA key

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>buffer</code> \| <code>string</code> | PEM encoded private key |
| callback | <code>function</code> | `{string}` err, `{buffer}` key |

<a name="getModulus"></a>

## getModulus(key, callback)
Get modulus

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>buffer</code> \| <code>string</code> | Private key, certificate or CSR |
| callback | <code>function</code> | `{string}` err, `{buffer}` modulus |

<a name="getPublicExponent"></a>

## getPublicExponent(key, callback)
Get public exponent

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>buffer</code> \| <code>string</code> | Private key, certificate or CSR |
| callback | <code>function</code> | `{string}` err, `{buffer}` exponent |

<a name="pem2der"></a>

## pem2der(key, callback)
Convert PEM to DER encoding

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>buffer</code> \| <code>string</code> | PEM encoded private key, certificate or CSR |
| callback | <code>function</code> | `{string}` err, `{buffer}` der |

<a name="der2pem"></a>

## der2pem(action, key, [pubIn], callback)
Convert DER to PEM encoding

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| action | <code>string</code> | Output action (x509, rsa, req) |
| key | <code>buffer</code> \| <code>string</code> | DER encoded private key, certificate or CSR |
| [pubIn] | <code>boolean</code> | Result should be a public key, default: `false` |
| callback | <code>function</code> | `{string}` err, `{buffer}` pem |

<a name="readCsrDomains"></a>

## readCsrDomains(csr, callback)
Read domains from a Certificate Signing Request

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| csr | <code>buffer</code> \| <code>string</code> | PEM encoded Certificate Signing Request |
| callback | <code>function</code> | `{string}` err, `{object}` {commonName, altNames} |

<a name="readCertificateInfo"></a>

## readCertificateInfo(cert, callback)
Read information from a certificate

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| cert | <code>buffer</code> \| <code>string</code> | PEM encoded certificate |
| callback | <code>function</code> | `{string}` err, `{object}` info |

<a name="createCsr"></a>

## createCsr(data, [key], callback)
Create a Certificate Signing Request

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> |  |
| [data.keySize] | <code>number</code> | Size of newly created private key, default: `2048` |
| [data.commonName] | <code>string</code> | default: `localhost` |
| [data.altNames] | <code>array</code> | default: `[]` |
| [data.country] | <code>string</code> |  |
| [data.state] | <code>string</code> |  |
| [data.locality] | <code>string</code> |  |
| [data.organization] | <code>string</code> |  |
| [data.organizationUnit] | <code>string</code> |  |
| [data.emailAddress] | <code>string</code> |  |
| [key] | <code>buffer</code> \| <code>string</code> | CSR private key |
| callback | <code>function</code> | `{string}` err, `{object}` {key, csr} |

