/**
 * node-forge crypto engine
 *
 * @namespace forge
 */

const net = require('net');
const Promise = require('bluebird');
const forge = require('node-forge');

const generateKeyPair = Promise.promisify(forge.pki.rsa.generateKeyPair);


/**
 * Attempt to parse forge object from PEM encoded string
 *
 * @private
 * @param {string} input PEM string
 * @return {object}
 */

function forgeObjectFromPem(input) {
    const msg = forge.pem.decode(input)[0];
    let key;

    switch (msg.type) {
        case 'PRIVATE KEY':
        case 'RSA PRIVATE KEY':
            key = forge.pki.privateKeyFromPem(input);
            break;

        case 'PUBLIC KEY':
        case 'RSA PUBLIC KEY':
            key = forge.pki.publicKeyFromPem(input);
            break;

        case 'CERTIFICATE':
        case 'X509 CERTIFICATE':
        case 'TRUSTED CERTIFICATE':
            key = forge.pki.certificateFromPem(input).publicKey;
            break;

        case 'CERTIFICATE REQUEST':
            key = forge.pki.certificationRequestFromPem(input).publicKey;
            break;

        default:
            throw new Error('Unable to detect forge message type');
    }

    return key;
}


/**
 * Parse domain names from a certificate or CSR
 *
 * @private
 * @param {object} obj Forge certificate or CSR
 * @returns {object} {commonName, altNames}
 */

function parseDomains(obj) {
    let commonName = null;
    let altNames = [];
    let altNamesDict = [];

    const commonNameObject = (obj.subject.attributes || []).find(a => a.name === 'commonName');
    const rootAltNames = (obj.extensions || []).find(e => 'altNames' in e);
    const rootExtensions = (obj.attributes || []).find(a => 'extensions' in a);

    if (rootAltNames && rootAltNames.altNames && rootAltNames.altNames.length) {
        altNamesDict = rootAltNames.altNames;
    }
    else if (rootExtensions && rootExtensions.extensions && rootExtensions.extensions.length) {
        const extAltNames = rootExtensions.extensions.find(e => 'altNames' in e);

        if (extAltNames && extAltNames.altNames && extAltNames.altNames.length) {
            altNamesDict = extAltNames.altNames;
        }
    }

    if (commonNameObject) {
        commonName = commonNameObject.value;
    }

    if (altNamesDict) {
        altNames = altNamesDict.map(a => a.value);
    }

    return {
        commonName,
        altNames
    };
}


/**
 * Generate a private RSA key
 *
 * @param {number} [size] Size of the key, default: `2048`
 * @returns {Promise<buffer>} Private RSA key
 */

async function createPrivateKey(size = 2048) {
    const keyPair = await generateKeyPair({ bits: size });
    const pemKey = forge.pki.privateKeyToPem(keyPair.privateKey);
    return Buffer.from(pemKey);
}

exports.createPrivateKey = createPrivateKey;


/**
 * Generate a public RSA key
 *
 * @param {buffer|string} key PEM encoded private key
 * @returns {Promise<buffer>} Public RSA key
 */

exports.createPublicKey = async function(key) {
    const privateKey = forge.pki.privateKeyFromPem(key);
    const publicKey = forge.pki.rsa.setPublicKey(privateKey.n, privateKey.e);
    const pemKey = forge.pki.publicKeyToPem(publicKey);
    return Buffer.from(pemKey);
};


/**
 * Get modulus
 *
 * @param {buffer|string} input PEM encoded private key, certificate or CSR
 * @returns {Promise<buffer>} Modulus
 */

exports.getModulus = async function(input) {
    if (!Buffer.isBuffer(input)) {
        input = Buffer.from(input);
    }

    const obj = forgeObjectFromPem(input);
    return Buffer.from(forge.util.hexToBytes(obj.n.toString(16)), 'binary');
};


/**
 * Get public exponent
 *
 * @param {buffer|string} input PEM encoded private key, certificate or CSR
 * @returns {Promise<buffer>} Exponent
 */

exports.getPublicExponent = async function(input) {
    if (!Buffer.isBuffer(input)) {
        input = Buffer.from(input);
    }

    const obj = forgeObjectFromPem(input);
    return Buffer.from(forge.util.hexToBytes(obj.e.toString(16)), 'binary');
};


/**
 * Read domains from a Certificate Signing Request
 *
 * @param {buffer|string} csr PEM encoded Certificate Signing Request
 * @returns {Promise<object>} {commonName, altNames}
 */

exports.readCsrDomains = async function(csr) {
    if (!Buffer.isBuffer(csr)) {
        csr = Buffer.from(csr);
    }

    const obj = forge.pki.certificationRequestFromPem(csr);
    return parseDomains(obj);
};


/**
 * Read information from a certificate
 *
 * @param {buffer|string} cert PEM encoded certificate
 * @returns {Promise<object>} Certificate info
 */

exports.readCertificateInfo = async function(cert) {
    if (!Buffer.isBuffer(cert)) {
        cert = Buffer.from(cert);
    }

    const obj = forge.pki.certificateFromPem(cert);

    return {
        domains: parseDomains(obj),
        notAfter: obj.validity.notAfter,
        notBefore: obj.validity.notBefore
    };
};


/**
 * Determine ASN.1 type for CSR subject short name
 * Note: https://tools.ietf.org/html/rfc5280
 *
 * @private
 * @param {string} shortName CSR subject short name
 * @returns {forge.asn1.Type} ASN.1 type
 */

function getCsrValueTagClass(shortName) {
    switch (shortName) {
        case 'C':
            return forge.asn1.Type.PRINTABLESTRING;
        case 'E':
            return forge.asn1.Type.IA5STRING;
        default:
            return forge.asn1.Type.UTF8;
    }
}


/**
 * Create array of short names and values for Certificate Signing Request subjects
 *
 * @private
 * @param {object} subjectObj Key-value of short names and values
 * @returns {object[]} Certificate Signing Request subject array
 */

function createCsrSubject(subjectObj) {
    return Object.entries(subjectObj).reduce((result, [shortName, value]) => {
        if (value) {
            const valueTagClass = getCsrValueTagClass(shortName);
            result.push({ shortName, value, valueTagClass });
        }

        return result;
    }, []);
}


/**
 * Create array of alt names for Certificate Signing Requests
 * Note: https://github.com/digitalbazaar/forge/blob/dfdde475677a8a25c851e33e8f81dca60d90cfb9/lib/x509.js#L1444-L1454
 *
 * @private
 * @param {string[]} altNames Alt names
 * @returns {object[]} Certificate Signing Request alt names array
 */

function formatCsrAltNames(altNames) {
    return altNames.map((value) => {
        const type = net.isIP(value) ? 7 : 2;
        return { type, value };
    });
}


/**
 * Create a Certificate Signing Request
 *
 * @param {object} data
 * @param {number} [data.keySize] Size of newly created private key, default: `2048`
 * @param {string} [data.commonName] default: `localhost`
 * @param {array} [data.altNames] default: `[]`
 * @param {string} [data.country]
 * @param {string} [data.state]
 * @param {string} [data.locality]
 * @param {string} [data.organization]
 * @param {string} [data.organizationUnit]
 * @param {string} [data.emailAddress]
 * @param {buffer|string} [key] CSR private key
 * @returns {Promise<buffer[]>} [privateKey, certificateSigningRequest]
 */

exports.createCsr = async function(data, key = null) {
    if (!key) {
        key = await createPrivateKey(data.keySize);
    }
    else if (!Buffer.isBuffer(key)) {
        key = Buffer.from(key);
    }

    const csr = forge.pki.createCertificationRequest();

    /* Public key */
    const privateKey = forge.pki.privateKeyFromPem(key);
    const publicKey = forge.pki.rsa.setPublicKey(privateKey.n, privateKey.e);
    csr.publicKey = publicKey;

    /* Subject */
    const subject = createCsrSubject({
        CN: data.commonName || 'localhost',
        C: data.country,
        ST: data.state,
        L: data.locality,
        O: data.organization,
        OU: data.organizationUnit,
        E: data.emailAddress
    });

    csr.setSubject(subject);

    /* SAN extension */
    if (data.altNames && data.altNames.length) {
        csr.setAttributes([{
            name: 'extensionRequest',
            extensions: [{
                name: 'subjectAltName',
                altNames: formatCsrAltNames(data.altNames)
            }]
        }]);
    }

    /* Sign CSR */
    csr.sign(privateKey);

    /* Done */
    const pemCsr = forge.pki.certificationRequestToPem(csr);
    return [key, Buffer.from(pemCsr)];
};
