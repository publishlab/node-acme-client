## Objects

<dl>
<dt><a href="#openssl">openssl</a> : <code>object</code></dt>
<dd><p>OpenSSL crypto engine</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#createPrivateKey">createPrivateKey([size])</a> ⇒ <code>Promise.&lt;buffer&gt;</code></dt>
<dd><p>Generate a private RSA key</p>
</dd>
<dt><a href="#createPublicKey">createPublicKey(key)</a> ⇒ <code>Promise.&lt;buffer&gt;</code></dt>
<dd><p>Generate a public RSA key</p>
</dd>
<dt><a href="#getModulus">getModulus(input)</a> ⇒ <code>Promise.&lt;buffer&gt;</code></dt>
<dd><p>Get modulus</p>
</dd>
<dt><a href="#getPublicExponent">getPublicExponent(input)</a> ⇒ <code>Promise.&lt;buffer&gt;</code></dt>
<dd><p>Get public exponent</p>
</dd>
<dt><a href="#readCsrDomains">readCsrDomains(csr)</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>Read domains from a Certificate Signing Request</p>
</dd>
<dt><a href="#readCertificateInfo">readCertificateInfo(cert)</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>Read information from a certificate</p>
</dd>
<dt><a href="#createCsr">createCsr(data, [key])</a> ⇒ <code>Promise.&lt;Array.&lt;buffer&gt;&gt;</code></dt>
<dd><p>Create a Certificate Signing Request</p>
</dd>
<dt><a href="#pem2der">pem2der(key)</a> ⇒ <code>Promise.&lt;buffer&gt;</code></dt>
<dd><p>Convert PEM to DER encoding
DEPRECATED - DO NOT USE</p>
</dd>
<dt><a href="#der2pem">der2pem(action, key, [pubIn])</a> ⇒ <code>Promise.&lt;buffer&gt;</code></dt>
<dd><p>Convert DER to PEM encoding
DEPRECATED - DO NOT USE</p>
</dd>
</dl>

<a name="openssl"></a>

## openssl : <code>object</code>
OpenSSL crypto engine

**Kind**: global namespace  
<a name="createPrivateKey"></a>

## createPrivateKey([size]) ⇒ <code>Promise.&lt;buffer&gt;</code>
Generate a private RSA key

**Kind**: global function  
**Returns**: <code>Promise.&lt;buffer&gt;</code> - Private RSA key  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [size] | <code>number</code> | <code>2048</code> | Size of the key, default: `2048` |

<a name="createPublicKey"></a>

## createPublicKey(key) ⇒ <code>Promise.&lt;buffer&gt;</code>
Generate a public RSA key

**Kind**: global function  
**Returns**: <code>Promise.&lt;buffer&gt;</code> - Public RSA key  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>buffer</code> \| <code>string</code> | PEM encoded private key |

<a name="getModulus"></a>

## getModulus(input) ⇒ <code>Promise.&lt;buffer&gt;</code>
Get modulus

**Kind**: global function  
**Returns**: <code>Promise.&lt;buffer&gt;</code> - Modulus  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>buffer</code> \| <code>string</code> | PEM encoded private key, certificate or CSR |

<a name="getPublicExponent"></a>

## getPublicExponent(input) ⇒ <code>Promise.&lt;buffer&gt;</code>
Get public exponent

**Kind**: global function  
**Returns**: <code>Promise.&lt;buffer&gt;</code> - Exponent  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>buffer</code> \| <code>string</code> | PEM encoded private key, certificate or CSR |

<a name="readCsrDomains"></a>

## readCsrDomains(csr) ⇒ <code>Promise.&lt;object&gt;</code>
Read domains from a Certificate Signing Request

**Kind**: global function  
**Returns**: <code>Promise.&lt;object&gt;</code> - {commonName, altNames}  

| Param | Type | Description |
| --- | --- | --- |
| csr | <code>buffer</code> \| <code>string</code> | PEM encoded Certificate Signing Request |

<a name="readCertificateInfo"></a>

## readCertificateInfo(cert) ⇒ <code>Promise.&lt;object&gt;</code>
Read information from a certificate

**Kind**: global function  
**Returns**: <code>Promise.&lt;object&gt;</code> - Certificate info  

| Param | Type | Description |
| --- | --- | --- |
| cert | <code>buffer</code> \| <code>string</code> | PEM encoded certificate |

<a name="createCsr"></a>

## createCsr(data, [key]) ⇒ <code>Promise.&lt;Array.&lt;buffer&gt;&gt;</code>
Create a Certificate Signing Request

**Kind**: global function  
**Returns**: <code>Promise.&lt;Array.&lt;buffer&gt;&gt;</code> - [privateKey, certificateSigningRequest]  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> |  |
| [data.keySize] | <code>number</code> | Size of newly created private key, default: `2048` |
| [data.commonName] | <code>string</code> |  |
| [data.altNames] | <code>array</code> | default: `[]` |
| [data.country] | <code>string</code> |  |
| [data.state] | <code>string</code> |  |
| [data.locality] | <code>string</code> |  |
| [data.organization] | <code>string</code> |  |
| [data.organizationUnit] | <code>string</code> |  |
| [data.emailAddress] | <code>string</code> |  |
| [key] | <code>buffer</code> \| <code>string</code> | CSR private key |

<a name="pem2der"></a>

## pem2der(key) ⇒ <code>Promise.&lt;buffer&gt;</code>
Convert PEM to DER encoding
DEPRECATED - DO NOT USE

**Kind**: global function  
**Returns**: <code>Promise.&lt;buffer&gt;</code> - DER  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>buffer</code> \| <code>string</code> | PEM encoded private key, certificate or CSR |

<a name="der2pem"></a>

## der2pem(action, key, [pubIn]) ⇒ <code>Promise.&lt;buffer&gt;</code>
Convert DER to PEM encoding
DEPRECATED - DO NOT USE

**Kind**: global function  
**Returns**: <code>Promise.&lt;buffer&gt;</code> - PEM  

| Param | Type | Description |
| --- | --- | --- |
| action | <code>string</code> | Output action (x509, rsa, req) |
| key | <code>buffer</code> \| <code>string</code> | DER encoded private key, certificate or CSR |
| [pubIn] | <code>boolean</code> | Result should be a public key, default: `false` |

