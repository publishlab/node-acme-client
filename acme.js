/*
 * acme-client
 */

exports.Client = require('./lib/client');


/*
 * Directory URIs
 */

exports.directory = {
    letsencrypt: {
        staging: 'https://acme-staging.api.letsencrypt.org/directory',
        production: 'https://acme-v01.api.letsencrypt.org/directory'
    }
};


/*
 * OpenSSL helper
 */

exports.openssl = require('./lib/openssl');
