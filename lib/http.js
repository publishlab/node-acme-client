/*
 * ACME HTTP client
 */

var crypto = require('crypto');
var fmt = require('util').format;
var async = require('async');
var merge = require('merge');
var request = require('request');
var debug = require('debug')('acme-client');
var openssl = require('./openssl');
var helper = require('./helper');


/**
 * ACME HTTP client
 *
 * @class
 * @param {string} directoryUri Directory URL to the ACME provider
 * @param {buffer} accountKey PEM encoded private account key
 */

function HttpClient(directoryUri, accountKey) {
    this.directoryUri = directoryUri;
    this.accountKey = accountKey;

    this.directory = null;
    this.jwk = null;
}


/**
 * HTTP request
 *
 * @param {string} uri HTTP URI
 * @param {string} method HTTP method
 * @param {object} [opts] Request options
 * @param {function} callback `{string}` err, `{object}` resp, `{object}` body
 */

HttpClient.prototype.request = function(uri, method, opts, callback) {
    if (typeof callback === 'undefined') {
        callback = opts;
        opts = {};
    }

    opts.uri = uri;
    opts.method = method;
    opts.json = true;

    debug('HTTP request: %s %s', method, uri);

    /* Request */
    request(opts, function(err, resp, body) {
        if (err) return callback(err);

        debug('RESP %d %s %s', resp.statusCode, method, uri);
        callback(err, resp, body);
    });
};


/**
 * Ensure provider directory exists
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#directory
 *
 * @param {function} callback `{string}` err
 */

HttpClient.prototype.getDirectory = function(callback) {
    var self = this;

    if (self.directory) {
        return callback(null);
    }

    self.request(self.directoryUri, 'GET', function(err, resp, body) {
        if (err) return callback(err);

        self.directory = body;

        callback(null);
    });
};


/**
 * Get JSON Web Key
 *
 * @param {function} callback `{string}` err, `{object}` {e, kty, n}
 */

HttpClient.prototype.getJwk = function(callback) {
    var self = this;

    if (self.jwk) {
        return callback(null, self.jwk);
    }

    /* Get public exponent and modulus */
    async.parallel({
        exponent: async.apply(openssl.getPublicExponent, self.accountKey),
        modulus: async.apply(openssl.getModulus, self.accountKey)
    }, function(err, data) {
        if (err) return callback(err);

        /* Create JWK */
        self.jwk = {
            e: helper.b64encode(data.exponent),
            kty: 'RSA',
            n: helper.b64encode(data.modulus)
        };

        callback(null, self.jwk);
    });
};


/**
 * Get nonce from directory API endpoint
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#getting-a-nonce
 *
 * @param {function} callback `{string}` err, `{string}` nonce
 */

HttpClient.prototype.getNonce = function(callback) {
    /* Request a fresh nonce */
    this.request(this.directoryUri, 'HEAD', function(err, resp) {
        if (err) return callback(err);

        if (!resp.headers['replay-nonce']) {
            return callback('Failed to get nonce from provider');
        }

        callback(null, resp.headers['replay-nonce']);
    });
};


/**
 * Get URI for a directory resource
 *
 * @param {string} resource API resource name
 * @param {function} callback `{string}` err, `{string}` uri
 */

HttpClient.prototype.getResourceUri = function(resource, callback) {
    var self = this;

    self.getDirectory(function(err) {
        if (err) return callback(err);

        if (!self.directory[resource]) {
            return callback(fmt('Could not resolve URI for API resource: "%s"', resource));
        }

        callback(null, self.directory[resource]);
    });
};


/**
 * Create signed HTTP request body
 *
 * @param {object} payload Request payload
 * @param {string} [nonce] Request nonce
 * @param {function} callback `{string}` err, `{object}` body
 */

HttpClient.prototype.createSignedBody = function(payload, nonce, callback) {
    if (typeof callback === 'undefined') {
        callback = nonce;
        nonce = null;
    }

    var self = this;

    /* Get JWK */
    self.getJwk(function(err, jwk) {
        if (err) return callback(err);

        /* Request header */
        var header = {
            alg: 'RS256',
            jwk: jwk
        };

        /* Request payload */
        var protectedOpts = {};

        if (nonce) {
            debug('Using nonce: %s', nonce);
            protectedOpts.nonce = nonce;
        }

        var payload64 = helper.b64encode(JSON.stringify(payload));
        var protected = merge(true, header, protectedOpts);
        var protected64 = helper.b64encode(JSON.stringify(protected));

        /* Signature */
        var signer = crypto.createSign('RSA-SHA256')
            .update(fmt('%s.%s', protected64, payload64), 'utf8');

        var signature64 = helper.b64escape(signer.sign(self.accountKey, 'base64'));

        /* Request data */
        callback(null, {
            header: header,
            protected: protected64,
            payload: payload64,
            signature: signature64
        });
    });
};


/**
 * Signed HTTP request
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#request-authentication
 *
 * @param {string} uri HTTP URI
 * @param {string} method HTTP method
 * @param {object} payload Request payload
 * @param {function} callback `{string}` err, `{object}` resp, `{object}` body
 */

HttpClient.prototype.signedRequest = function(uri, method, payload, callback) {
    var self = this;

    async.waterfall([
        /* Get nonce */
        self.getNonce.bind(self),

        /* Create signed body */
        async.apply(self.createSignedBody.bind(self), payload),

        /* Send request */
        function(data, done) {
            self.request(uri, method, { body: data }, done);
        }
    ], callback);
};


/* Expose client */
module.exports = HttpClient;
