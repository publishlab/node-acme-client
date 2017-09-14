/*
 * OpenSSL utility methods
 */

var fs = require('fs');
var net = require('net');
var fmt = require('util').format;
var async = require('async');
var tempfile = require('tempfile');
var openssl = require('openssl-wrapper').exec;

var createPrivateKey;


function hexpad(str) {
    return ((str.length % 2) === 1) ? '0' + str : str;
}


/**
 * Parse domain names from a certificate or CSR
 *
 * @private
 * @param {string} cert Certificate or CSR
 * @returns {array} Array of domains
 */

function parseDomains(cert) {
    var domains = [];
    var commonNameMatch = cert.match(/Subject:.*? CN\s?=\s?([^\s,;\/]+)/);
    var altNamesMatch = cert.match(/X509v3 Subject Alternative Name:\s?\n\s*([^\n]+)\n/);

    /* Subject common name */
    if (commonNameMatch) {
        domains.push(commonNameMatch[1]);
    }

    /* Alternative names */
    if (altNamesMatch) {
        var altNames = altNamesMatch[1].split(/,\s*/);

        altNames.forEach(function(altName) {
            if (altName.match(/^DNS:/)) {
                domains.push(altName.replace(/^DNS:/, ''));
            }
        });
    }

    /* Filter out duplicates */
    return domains.reduce(function(result, domain) {
        if (result.indexOf(domain) === -1) {
            result.push(domain);
        }

        return result;
    }, []);
}


/**
 * Get OpenSSL action from buffer
 *
 * @private
 * @param {buffer} key Private key, certificate or CSR
 * @returns {string} OpenSSL action
 */

function getAction(key) {
    var keyString = key.toString();

    if (keyString.match(/CERTIFICATE\sREQUEST-{5}$/m)) {
        return 'req';
    }
    else if (keyString.match(/(PUBLIC|PRIVATE)\sKEY-{5}$/m)) {
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
 * @function
 * @param {number} [size] Size of the key, default: `2048`
 * @param {function} callback `{string}` err, `{buffer}` key
 */

createPrivateKey = exports.createPrivateKey = function(size, callback) {
    if (typeof callback === 'undefined') {
        callback = size;
        size = 2048;
    }

    var opts = {};
    opts[size] = false;

    openssl('genrsa', opts, callback);
};


/**
 * Generate a public RSA key
 *
 * @param {buffer|string} key PEM encoded private key
 * @param {function} callback `{string}` err, `{buffer}` key
 */

exports.createPublicKey = function(key, callback) {
    if (!Buffer.isBuffer(key)) {
        key = new Buffer(key);
    }

    var action = getAction(key);

    var opts = {
        pubout: true
    };

    openssl(action, key, opts, callback);
};


/**
 * Get modulus
 *
 * @param {buffer|string} key Private key, certificate or CSR
 * @param {function} callback `{string}` err, `{buffer}` modulus
 */

exports.getModulus = function(key, callback) {
    if (!Buffer.isBuffer(key)) {
        key = new Buffer(key);
    }

    var action = getAction(key);

    var opts = {
        noout: true,
        modulus: true
    };

    if (isPublic(key)) {
        opts.pubin = true;
    }

    openssl(action, key, opts, function(err, buf) {
        if (err) return callback(err);

        var modMatch = buf.toString().match(/^Modulus=([A-Fa-f0-9]+)$/m);

        if (!modMatch) {
            return callback('No modulus found');
        }

        var modulus = new Buffer(modMatch[1], 'hex');
        callback(null, modulus);
    });
};


/**
 * Get public exponent
 *
 * @param {buffer|string} key Private key, certificate or CSR
 * @param {function} callback `{string}` err, `{buffer}` exponent
 */

exports.getPublicExponent = function(key, callback) {
    if (!Buffer.isBuffer(key)) {
        key = new Buffer(key);
    }

    var action = getAction(key);

    var opts = {
        noout: true,
        text: true
    };

    if (isPublic(key)) {
        opts.pubin = true;
    }

    openssl(action, key, opts, function(err, buf) {
        if (err) return callback(err);

        var expMatch = buf.toString().match(/xponent:.*\(0x(\d+)\)/);

        if (!expMatch) {
            return callback('No public exponent found');
        }

        /* Pad exponent hex value */
        var exponent = new Buffer(hexpad(expMatch[1]), 'hex');
        callback(null, exponent);
    });
};


/**
 * Convert PEM to DER encoding
 *
 * @param {buffer|string} key PEM encoded private key, certificate or CSR
 * @param {function} callback `{string}` err, `{buffer}` der
 */

exports.pem2der = function(key, callback) {
    if (!Buffer.isBuffer(key)) {
        key = new Buffer(key);
    }

    var action = getAction(key);

    var opts = {
        outform: 'der'
    };

    if (isPublic(key)) {
        opts.pubin = true;
    }

    openssl(action, key, opts, callback);
};


/**
 * Convert DER to PEM encoding
 *
 * @param {string} action Output action (x509, rsa, req)
 * @param {buffer|string} key DER encoded private key, certificate or CSR
 * @param {boolean} [pubIn] Result should be a public key, default: `false`
 * @param {function} callback `{string}` err, `{buffer}` pem
 */

exports.der2pem = function(action, key, pubIn, callback) {
    if (typeof callback === 'undefined') {
        callback = pubIn;
        pubIn = false;
    }

    if (!Buffer.isBuffer(key)) {
        key = new Buffer(key);
    }

    var opts = {
        inform: 'der'
    };

    if (pubIn) {
        opts.pubin = true;
    }

    openssl(action, key, opts, callback);
};


/**
 * Read domains from a Certificate Signing Request
 *
 * @param {buffer|string} csr PEM encoded Certificate Signing Request
 * @param {function} callback `{string}` err, `{array}` domains
 */

exports.readCsrDomains = function(csr, callback) {
    if (!Buffer.isBuffer(csr)) {
        csr = new Buffer(csr);
    }

    var opts = {
        noout: true,
        text: true
    };

    openssl('req', csr, opts, function(err, buf) {
        if (err) return callback(err);
        callback(null, parseDomains(buf.toString()));
    });
};


/**
 * Read information from a certificate
 *
 * @param {buffer|string} cert PEM encoded certificate
 * @param {function} callback `{string}` err, `{object}` info
 */

exports.readCertificateInfo = function(cert, callback) {
    if (!Buffer.isBuffer(cert)) {
        cert = new Buffer(cert);
    }

    var opts = {
        noout: true,
        text: true
    };

    openssl('x509', cert, opts, function(err, buf) {
        if (err) return callback(err);

        var bufString = buf.toString();

        var result = {
            domains: parseDomains(bufString),
            notBefore: null,
            notAfter: null
        };

        var notBeforeMatch = bufString.match(/Not\sBefore\s?:\s+([^\n]*)\n/);
        var notAfterMatch = bufString.match(/Not\sAfter\s?:\s+([^\n]*)\n/);

        if (notBeforeMatch) {
            result.notBefore = new Date(notBeforeMatch[1]);
        }

        if (notAfterMatch) {
            result.notAfter = new Date(notAfterMatch[1]);
        }

        callback(null, result);
    });
};


/**
 * Execute Certificate Signing Request generation
 *
 * @private
 * @param {object} opts CSR options
 * @param {string} csrConfig CSR configuration file
 * @param {buffer} key CSR private key
 * @param {function} callback `{string}` err, `{buffer}` csr
 */

function generateCsr(opts, csrConfig, key, callback) {
    /* Write key to disk */
    var tempKeyFilePath = tempfile();

    var preJobs = [async.apply(fs.writeFile, tempKeyFilePath, key)];
    var postJobs = [async.apply(fs.unlink, tempKeyFilePath)];

    opts.key = tempKeyFilePath;

    if (csrConfig) {
        /* Write config to disk */
        var tempConfigFilePath = tempfile();

        preJobs.push(async.apply(fs.writeFile, tempConfigFilePath, csrConfig));
        postJobs.push(async.apply(fs.unlink, tempConfigFilePath));

        opts.config = tempConfigFilePath;
    }

    /* Run jobs and cleanup */
    async.series([
        async.apply(async.parallel, preJobs),
        async.apply(openssl, 'req', opts),
        async.apply(async.parallel, postJobs)
    ], function(err, data) {
        if (err) return callback(err);
        callback(null, data[1]);
    });
}


/**
 * Create Certificate Signing Request subject
 *
 * @private
 * @param {object} opts CSR subject options
 * @returns {string} CSR subject
 */

function createCsrSubject(opts) {
    var data = {
        C: opts.country,
        ST: opts.state,
        L: opts.locality,
        O: opts.organization,
        OU: opts.organizationUnit,
        CN: opts.commonName || 'localhost',
        emailAddress: opts.emailAddress
    };

    return Object.keys(data).map(function(k) {
        return data[k] ? fmt('/%s=%s', k, data[k].replace(/[^\w \.\*\-\,@']+/g, ' ').trim()) : '';
    }).join('');
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
 * @param {function} callback `{string}` err, `{object}` {key, csr}
 */

exports.createCsr = function(data, key, callback) {
    if (typeof callback === 'undefined') {
        callback = key;
        key = null;
    }

    if (key && !Buffer.isBuffer(key)) {
        key = new Buffer(key);
    }

    /* Create CSR options */
    var opts = {
        new: true,
        sha256: true,
        subj: createCsrSubject(data)
    };

    /* Create CSR config for SAN CSR */
    var csrConfig = null;

    if (data.altNames && data.altNames.length) {
        opts.extensions = 'v3_req';

        var altNames = Object.keys(data.altNames).map(function(i) {
            var prefix = net.isIP(data.altNames[i]) ? 'IP' : 'DNS';
            return fmt('%s.%d=%s', prefix, (i + 1), data.altNames[i]);
        });

        csrConfig = '[req]\n' +
            'req_extensions = v3_req\n' +
            'distinguished_name = req_distinguished_name\n' +
            '[v3_req]\n' +
            'subjectAltName = @alt_names\n' +
            '[alt_names]\n' +
            altNames.join('\n') + '\n' +
            '[req_distinguished_name]\n' +
            'commonName = Common Name\n' +
            'commonName_max = 64';
    }

    /* Run jobs */
    async.waterfall([
        function(done) {
            if (key) return done(null, key);
            createPrivateKey(data.keySize || 2048, done);
        },
        function(csrKey, done) {
            generateCsr(opts, csrConfig, csrKey, function(err, csr) {
                if (err) return done(err);
                done(null, { key: csrKey, csr: csr });
            });
        }
    ], callback);
};
