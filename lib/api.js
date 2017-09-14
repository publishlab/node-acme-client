/*
 * ACME API
 */

var async = require('async');


/**
 * AcmeApi
 *
 * @class
 * @param {HttpClient} httpClient
 */

function AcmeApi(httpClient) {
    this.http = httpClient;
}


/**
 * ACME API HTTP request
 *
 * @private
 * @param {object} data Request payload
 * @param {string} method HTTP method
 * @param {array} [validStatusCodes] Array of valid HTTP response status codes
 * @param {string} [uri] HTTP request URI
 * @param {function} callback `{string}` err, `{object}` resp, `{object}` body
 */

AcmeApi.prototype.__apiRequest = function(data, method, validStatusCodes, uri, callback) {
    if (typeof uri === 'undefined') {
        uri = validStatusCodes;
        validStatusCodes = [];
    }

    if (typeof callback === 'undefined') {
        callback = uri;
        uri = null;
    }

    var self = this;

    async.waterfall([
        /* Resolve URI if none were specified */
        function(done) {
            if (uri) return done(null, uri);
            self.http.getResourceUri(data.resource, done);
        },

        /* Make request */
        function(resourceUri, done) {
            self.http.signedRequest(resourceUri, method, data, done);
        },

        /* Verify status code */
        function(resp, body, done) {
            if (validStatusCodes.length && (validStatusCodes.indexOf(resp.statusCode) === -1)) {
                return done(body.error || body.detail || body);
            }

            done(null, resp, body);
        }
    ], callback);
};


/**
 * new-reg
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-creation
 *
 * @param {object} data Request payload
 * @param {function} callback `{string}` err, `{object}` resp, `{object}` body
 */

AcmeApi.prototype.newReg = function(data, callback) {
    var validStatusCodes = [201, 409];
    data.resource = 'new-reg';

    this.__apiRequest(data, 'POST', validStatusCodes, callback);
};


/**
 * reg
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-update
 *
 * @param {string} uri Registration URI
 * @param {object} data Request payload
 * @param {function} callback `{string}` err, `{object}` resp, `{object}` body
 */

AcmeApi.prototype.reg = function(uri, data, callback) {
    var validStatusCodes = [200, 202];
    data.resource = 'reg';

    this.__apiRequest(data, 'POST', validStatusCodes, uri, callback);
};


/**
 * key-change
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-key-roll-over
 *
 * @param {object} data Request payload
 * @param {function} callback `{string}` err, `{object}` resp, `{object}` body
 */

AcmeApi.prototype.keyChange = function(data, callback) {
    var validStatusCodes = [200];
    data.resource = 'key-change';

    this.__apiRequest(data, 'POST', validStatusCodes, callback);
};


/**
 * new-authz
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#pre-authorization
 *
 * @param {object} data Request payload
 * @param {function} callback `{string}` err, `{object}` resp, `{object}` body
 */

AcmeApi.prototype.newAuthz = function(data, callback) {
    var validStatusCodes = [201];
    data.resource = 'new-authz';

    this.__apiRequest(data, 'POST', validStatusCodes, callback);
};


/**
 * authz
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#identifier-authorization
 *
 * @param {object} data Request payload
 * @param {function} callback `{string}` err, `{object}` resp, `{object}` body
 */

AcmeApi.prototype.authz = function(data, callback) {
    var validStatusCodes = [200];
    data.resource = 'authz';

    this.__apiRequest(data, 'POST', validStatusCodes, callback);
};


/**
 * new-cert
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#applying-for-certificate-issuance
 *
 * @param {object} data Request payload
 * @param {function} callback `{string}` err, `{object}` resp, `{object}` body
 */

AcmeApi.prototype.newCert = function(data, callback) {
    var validStatusCodes = [201];
    data.resource = 'new-cert';

    this.__apiRequest(data, 'POST', validStatusCodes, callback);
};


/**
 * revoke-cert
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#certificate-revocation
 *
 * @param {object} data Request payload
 * @param {function} callback `{string}` err, `{object}` resp, `{object}` body
 */

AcmeApi.prototype.revokeCert = function(data, callback) {
    var validStatusCodes = [200];
    data.resource = 'revoke-cert';

    this.__apiRequest(data, 'POST', validStatusCodes, callback);
};


/**
 * challenge
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#responding-to-challenges
 *
 * @param {string} uri Challenge URI
 * @param {object} data Request payload
 * @param {function} callback `{string}` err, `{object}` resp, `{object}` body
 */

AcmeApi.prototype.challenge = function(uri, data, callback) {
    var validStatusCodes = [202];
    data.resource = 'challenge';

    this.__apiRequest(data, 'POST', validStatusCodes, uri, callback);
};


/* Expose API */
module.exports = AcmeApi;
