/**
 * OpenSSL crypto engine
 *
 * @namespace openssl
 */

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const net = require('net');
const tempfile = require('tempfile');
const opensslExec = require('openssl-wrapper').exec;


function openssl(...args) {
    return new Promise((resolve, reject) => {
        opensslExec(...args, (err, result) => (err ? reject(err) : resolve(result))).on('error', reject);
    });
}

function hexpad(str) {
    return ((str.length % 2) === 1) ? `0${str}` : str;
}


/**
 * Parse domain names from a certificate or CSR
 *
 * @private
 * @param {string} cert Certificate or CSR
 * @returns {object} {commonName, altNames}
 */

function parseDomains(cert) {
    const altNames = [];
    let commonName = null;
    const commonNameMatch = cert.match(/Subject:.*? CN\s?=\s?([^\s,;/]+)/);
    const altNamesMatch = cert.match(/X509v3 Subject Alternative Name:\s?\n\s*([^\n]+)\n/);

    /* Subject common name */
    if (commonNameMatch) {
        commonName = commonNameMatch[1];
    }

    /* Alternative names */
    if (altNamesMatch) {
        altNamesMatch[1].split(/,\s*/).forEach((altName) => {
            if (altName.match(/^DNS:/)) {
                altNames.push(altName.replace(/^DNS:/, ''));
            }
        });
    }

    return {
        commonName,
        altNames
    };
}


/**
 * Get OpenSSL action from buffer
 *
 * @private
 * @param {buffer} key Private key, certificate or CSR
 * @returns {string} OpenSSL action
 */

function getAction(key) {
    const keyString = key.toString();

    if (keyString.match(/CERTIFICATE\sREQUEST-{5}$/m)) {
        return 'req';
    }

    if (keyString.match(/(PUBLIC|PRIVATE)\sKEY-{5}$/m)) {
        return 'rsa';
    }

    return 'x509';
}


/**
 * Check if key is public
 *
 * @private
 * @param {buffer} key
 * @returns {boolean} True if key is public
 */

function isPublic(key) {
    return !!key.toString().match(/PUBLIC\sKEY-{5}$/m);
}


/**
 * Generate a private RSA key
 *
 * @param {number} [size] Size of the key, default: `2048`
 * @returns {Promise<buffer>} Private RSA key
 */

function createPrivateKey(size = 2048) {
    const opts = {};
    opts[size] = false;

    return openssl('genrsa', opts);
}

exports.createPrivateKey = createPrivateKey;


/**
 * Generate a public RSA key
 *
 * @param {buffer|string} key PEM encoded private key
 * @returns {Promise<buffer>} Public RSA key
 */

exports.createPublicKey = function(key) {
    if (!Buffer.isBuffer(key)) {
        key = Buffer.from(key);
    }

    const action = getAction(key);
    const opts = { pubout: true };

    return openssl(action, key, opts);
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

    const action = getAction(input);
    const opts = { noout: true, modulus: true };

    if (isPublic(input)) {
        opts.pubin = true;
    }

    const buf = await openssl(action, input, opts);
    const modulusMatch = buf.toString().match(/^Modulus=([A-Fa-f0-9]+)$/m);

    if (!modulusMatch) {
        throw new Error('No modulus found');
    }

    return Buffer.from(modulusMatch[1], 'hex');
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

    const action = getAction(input);
    const opts = { noout: true, text: true };

    if (isPublic(input)) {
        opts.pubin = true;
    }

    const buf = await openssl(action, input, opts);
    const exponentMatch = buf.toString().match(/xponent:.*\(0x(\d+)\)/);

    if (!exponentMatch) {
        throw new Error('No public exponent found');
    }

    /* Pad exponent hex value */
    return Buffer.from(hexpad(exponentMatch[1]), 'hex');
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

    const opts = { noout: true, text: true };
    const buf = await openssl('req', csr, opts);

    return parseDomains(buf.toString());
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

    const opts = { noout: true, text: true };
    const buf = await openssl('x509', cert, opts);
    const bufString = buf.toString();

    const result = {
        domains: parseDomains(bufString),
        notBefore: null,
        notAfter: null
    };

    const notBeforeMatch = bufString.match(/Not\sBefore\s?:\s+([^\n]*)\n/);
    const notAfterMatch = bufString.match(/Not\sAfter\s?:\s+([^\n]*)\n/);

    if (notBeforeMatch) {
        result.notBefore = new Date(notBeforeMatch[1]);
    }

    if (notAfterMatch) {
        result.notAfter = new Date(notAfterMatch[1]);
    }

    return result;
};


/**
 * Execute Certificate Signing Request generation
 *
 * @private
 * @param {object} opts CSR options
 * @param {string} csrConfig CSR configuration file
 * @param {buffer} key CSR private key
 * @returns {Promise<buffer>} CSR
 */

async function generateCsr(opts, csrConfig, key) {
    let tempConfigFilePath;

    /* Write key to disk */
    const tempKeyFilePath = tempfile();
    await fs.writeFileAsync(tempKeyFilePath, key);
    opts.key = tempKeyFilePath;

    /* Write config to disk */
    if (csrConfig) {
        tempConfigFilePath = tempfile();
        await fs.writeFileAsync(tempConfigFilePath, csrConfig);
        opts.config = tempConfigFilePath;
    }

    /* Create CSR */
    const result = await openssl('req', opts);

    /* Clean up */
    await fs.unlinkAsync(tempKeyFilePath);

    if (tempConfigFilePath) {
        await fs.unlinkAsync(tempConfigFilePath);
    }

    return result;
}


/**
 * Create Certificate Signing Request subject
 *
 * @private
 * @param {object} opts CSR subject options
 * @returns {string} CSR subject
 */

function createCsrSubject(opts) {
    const data = {
        C: opts.country,
        ST: opts.state,
        L: opts.locality,
        O: opts.organization,
        OU: opts.organizationUnit,
        CN: opts.commonName,
        emailAddress: opts.emailAddress
    };

    return Object.entries(data).map(([key, value]) => {
        value = (value || '').replace(/[^\w .*,@'-]+/g, ' ').trim();
        return value ? `/${key}=${value}` : '';
    }).join('');
}


/**
 * Create a Certificate Signing Request
 *
 * @param {object} data
 * @param {number} [data.keySize] Size of newly created private key, default: `2048`
 * @param {string} [data.commonName]
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

    if (typeof data.altNames === 'undefined') {
        data.altNames = [];
    }

    /* Ensure subject common name is present in SAN - https://cabforum.org/wp-content/uploads/BRv1.2.3.pdf */
    if (data.commonName && !data.altNames.includes(data.commonName)) {
        data.altNames.unshift(data.commonName);
    }

    /* Create CSR options */
    const opts = {
        new: true,
        sha256: true,
        subj: createCsrSubject(data) || '/'
    };

    /* Create CSR config for SAN CSR */
    let csrConfig = null;

    if (data.altNames.length) {
        opts.extensions = 'v3_req';

        const altNames = Object.entries(data.altNames).map(([k, v]) => {
            const i = parseInt(k, 10) + 1;
            const prefix = net.isIP(v) ? 'IP' : 'DNS';
            return `${prefix}.${i}=${v}`;
        });

        csrConfig = [
            '[req]',
            'req_extensions = v3_req',
            'distinguished_name = req_distinguished_name',
            '[v3_req]',
            'subjectAltName = @alt_names',
            '[alt_names]',
            altNames.join('\n'),
            '[req_distinguished_name]',
            'commonName = Common Name',
            'commonName_max = 64'
        ].join('\n');
    }

    /* Create CSR */
    const csr = await generateCsr(opts, csrConfig, key);

    return [key, csr];
};


/**
 * Convert PEM to DER encoding
 * DEPRECATED - DO NOT USE
 *
 * @param {buffer|string} key PEM encoded private key, certificate or CSR
 * @returns {Promise<buffer>} DER
 */

exports.pem2der = function(key) {
    if (!Buffer.isBuffer(key)) {
        key = Buffer.from(key);
    }

    const action = getAction(key);
    const opts = { outform: 'der' };

    if (isPublic(key)) {
        opts.pubin = true;
    }

    return openssl(action, key, opts);
};


/**
 * Convert DER to PEM encoding
 * DEPRECATED - DO NOT USE
 *
 * @param {string} action Output action (x509, rsa, req)
 * @param {buffer|string} key DER encoded private key, certificate or CSR
 * @param {boolean} [pubIn] Result should be a public key, default: `false`
 * @returns {Promise<buffer>} PEM
 */

exports.der2pem = function(action, key, pubIn = false) {
    if (!Buffer.isBuffer(key)) {
        key = Buffer.from(key);
    }

    const opts = { inform: 'der' };

    if (pubIn) {
        opts.pubin = true;
    }

    return openssl(action, key, opts);
};
