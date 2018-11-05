/*
 * acme-client
 */

exports.Client = require('./client');


/*
 * Directory URLs
 */

exports.directory = {
    letsencrypt: {
        staging: 'https://acme-staging-v02.api.letsencrypt.org/directory',
        production: 'https://acme-v02.api.letsencrypt.org/directory'
    }
};


/*
 * Crypto
 */

exports.openssl = require('./crypto/openssl');
