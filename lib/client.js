/*
 * ACME client
 */

var fmt = require('util').format;
var crypto = require('crypto');
var async = require('async');
var merge = require('merge').recursive;
var debug = require('debug')('acme-client');
var HttpClient = require('./http');
var AcmeApi = require('./api');
var openssl = require('./openssl');
var helper = require('./helper');
var easy = require('./easy');


/*
 * Default options
 */

var defaultOpts = {
    directoryUri: undefined,
    accountKey: undefined,
    acceptTermsOfService: false,
    waitForChallengeSettings: {
        times: 5,
        interval: 5000
    }
};


/**
 * AcmeClient
 *
 * @class
 * @param {object} opts ACME client options
 * @param {string} opts.directoryUri
 * @param {buffer|string} opts.accountKey
 * @param {boolean} [opts.acceptTermsOfService] default: `false`
 * @param {object} [opts.waitForChallengeSettings]
 * @param {number} [opts.waitForChallengeSettings.times] default: `5`
 * @param {number} [opts.waitForChallengeSettings.interval] default: `5000`
 */

function AcmeClient(opts) {
    if (!Buffer.isBuffer(opts.accountKey)) {
        opts.accountKey = new Buffer(opts.accountKey);
    }

    this.opts = merge(defaultOpts, opts);
    this.accountUri = null;

    this.http = new HttpClient(this.opts.directoryUri, this.opts.accountKey);
    this.api = new AcmeApi(this.http);
}


/**
 * Terms of Service handler
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#changes-of-terms-of-service
 *
 * @private
 * @param {object} resp HTTP response
 * @param {object} body HTTP body
 * @param {function} callback `{string}` err, `{object}` body
 */

AcmeClient.prototype.__tosHandler = function(resp, body, callback) {
    debug('Account needs to accept Terms of Service');

    if (this.opts.acceptTermsOfService !== true) {
        debug('this.opts.acceptTermsOfService is not true, returning');
        return callback(null, body);
    }

    var links = helper.linkParser(resp.headers);
    var tosLink = links['terms-of-service'];

    this.updateAccount({
        agreement: tosLink
    }, callback);
};


/**
 * Register new account
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-creation
 *
 * @param {object} [data] Request data
 * @param {function} callback `{string}` err, `{object}` account
 */

AcmeClient.prototype.registerAccount = function(data, callback) {
    if (typeof callback === 'undefined') {
        callback = data;
        data = {};
    }

    var self = this;

    /* Make request */
    self.api.newReg(data, function(err, resp, body) {
        if (err) return callback(err);

        /* Set registration URI */
        if (resp.headers.location) {
            debug('Found account URI from headers');
            self.accountUri = resp.headers.location;
        }

        /* HTTP 409: Account exists */
        if (resp.statusCode === 409) {
            debug('Account already exists (HTTP 409), returning updateAccount()');
            return self.updateAccount(data, callback);
        }

        /* Trigger ToS handler */
        if (helper.tosRequired(data, resp, body)) {
            return self.__tosHandler(resp, body, callback);
        }

        callback(null, body);
    });
};


/**
 * Update existing account
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-update
 *
 * @param {object} [data] Request data
 * @param {function} callback `{string}` err, `{object}` account
 */

AcmeClient.prototype.updateAccount = function(data, callback) {
    if (typeof callback === 'undefined') {
        callback = data;
        data = {};
    }

    var self = this;

    /* Missing registration URI */
    if (!self.accountUri) {
        debug('No account URI found, returning registerAccount()');
        return self.registerAccount(data, callback);
    }

    /* Make request */
    self.api.reg(self.accountUri, data, function(err, resp, body) {
        if (err) return callback(err);

        /* Trigger ToS handler */
        if (helper.tosRequired(data, resp, body)) {
            return self.__tosHandler(resp, body, callback);
        }

        callback(null, body);
    });
};


/**
 * Change account private key
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-key-roll-over
 *
 * @param {buffer|string} newAccountKey New PEM encoded private key
 * @param {object} [data] Additional request data
 * @param {function} callback `{string}` err, `{object}` account
 */

AcmeClient.prototype.changeAccountKey = function(newAccountKey, data, callback) {
    if (typeof callback === 'undefined') {
        callback = data;
        data = {};
    }

    var self = this;

    if (!Buffer.isBuffer(newAccountKey)) {
        newAccountKey = new Buffer(newAccountKey);
    }

    /* Create new HTTP and API clients using new key */
    var newHttpClient = new HttpClient(self.opts.directoryUri, newAccountKey);
    var newApiClient = new AcmeApi(newHttpClient);

    async.waterfall([
        /* Get new JWK */
        newHttpClient.getJwk.bind(newHttpClient),

        /* Get signed request body from new client */
        function(jwk, done) {
            data.account = self.accountUri;
            data.newKey = jwk;

            newHttpClient.createSignedBody(data, done);
        },

        /* Make request */
        self.api.keyChange.bind(self.api)
    ], function(err, resp, body) {
        if (err) return callback(err);

        /* Overwrite existing HTTP and API clients */
        self.http = newHttpClient;
        self.api = newApiClient;

        callback(null, body);
    });
};


/**
 * Register a new domain
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#pre-authorization
 *
 * @param {object} data Request data
 * @param {function} callback `{string}` err, `{object}` domain
 */

AcmeClient.prototype.registerDomain = function(data, callback) {
    this.api.newAuthz(data, function(err, resp, body) {
        if (err) return callback(err);
        callback(null, body);
    });
};


/**
 * Get key authorization for ACME challenge
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#key-authorizations
 *
 * @param {object} challenge Challenge object returned by API
 * @param {function} callback `{string}` err, `{string}` keyAuthorization
 */

AcmeClient.prototype.getChallengeKeyAuthorization = function(challenge, callback) {
    this.http.getJwk(function(err, jwk) {
        if (err) return callback(err);

        var shasum = crypto.createHash('sha256')
            .update(JSON.stringify(jwk));

        var thumbprint = helper.b64escape(shasum.digest('base64'));
        var result = fmt('%s.%s', challenge.token, thumbprint);

        callback(null, result);
    });
};


/**
 * Notify provider that challenge has been completed
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#responding-to-challenges
 *
 * @param {object} challenge Challenge object returned by API
 * @param {function} callback `{string}` err, `{object}` challenge
 */

AcmeClient.prototype.completeChallenge = function(challenge, callback) {
    var self = this;

    async.waterfall([
        /* Get key authorization */
        async.apply(self.getChallengeKeyAuthorization.bind(self), challenge),

        /* Make request */
        function(keyAuthorization, done) {
            var data = {
                keyAuthorization: keyAuthorization
            };

            self.api.challenge(challenge.uri, data, function(err, resp, body) {
                if (err) return done(err);
                done(null, body);
            });
        }
    ], callback);
};


/**
 * Verify that ACME challenge is satisfied on base URI
 *
 * @param {string} baseUri Base URI
 * @param {object} challenge Challenge object returned by API
 * @param {function} callback `{string}` err
 */

AcmeClient.prototype.verifyChallengeBaseUri = function(baseUri, challenge, callback) {
    var self = this;
    var challengeUri = fmt('%s/.well-known/acme-challenge/%s', baseUri, challenge.token);

    debug('Verifying that challenge response is valid, settings: %j', self.opts.waitForChallengeSettings);

    var retryOpts = {
        times: self.opts.waitForChallengeSettings.times,
        interval: self.opts.waitForChallengeSettings.interval
    };

    async.waterfall([
        /* Get challenge key authorization */
        async.apply(self.getChallengeKeyAuthorization.bind(self), challenge),

        /* Retry until challenge is verified */
        function(keyAuthorization, wfdone) {
            async.retry(retryOpts, function(rdone) {
                self.http.request(challengeUri, 'GET', function(err, resp, body) {
                    if (err) return rdone(fmt('Error on URI: %s was invalid: %j', challengeUri, err));

                    /* Validate response */
                    if (!body || (body !== keyAuthorization)) {
                        return rdone(fmt('Response on URI: %s was invalid', challengeUri));
                    }

                    rdone(null);
                });
            }, wfdone);
        }
    ], callback);
};


/**
 * Wait for ACME provider to verify challenge status
 *
 * @param {object} challenge Challenge object returned by API
 * @param {function} callback `{string}` err, `{object}` challenge
 */

AcmeClient.prototype.waitForChallengeValidStatus = function(challenge, callback) {
    var self = this;

    debug('Waiting for challenge status to become valid, settings: %j', self.opts.waitForChallengeSettings);

    var retryOpts = {
        times: self.opts.waitForChallengeSettings.times,
        interval: self.opts.waitForChallengeSettings.interval,
        errorFilter: function(err) {
            return (err.status !== 'invalid');
        }
    };

    /* Retry until status is valid */
    async.retry(retryOpts, function(done) {
        self.http.request(challenge.uri, 'GET', function(err, resp, body) {
            if (err) return done(err);

            /* Require HTTP 202 */
            if (resp.statusCode !== 202) {
                return done(body.error || body.detail || body);
            }

            /* Verify status */
            debug('Challenge returned status: %s', body.status);

            if (body.status === 'pending') {
                return done('Operation not completed');
            }
            else if (body.status === 'invalid') {
                return done(body);
            }
            else if (body.status === 'valid') {
                return done(null, body);
            }

            done('Unexpected challenge status');
        });
    }, callback);
};


/**
 * Download single certificate
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#downloading-the-certificate
 *
 * @private
 * @param {string} uri Certificate URI
 * @param {function} callback `{string}` err, `{buffer}` certificate
 */

AcmeClient.prototype.__downloadCert = function(uri, callback) {
    this.http.request(uri, 'GET', { encoding: null }, function(err, resp, body) {
        if (err) return callback(err);

        /* Require HTTP 200 */
        if (resp.statusCode !== 200) {
            return callback(body.error || body.detail || body);
        }

        /* Convert DER certificate to PEM encoding */
        openssl.der2pem('x509', body, callback);
    });
};


/**
 * Download certificate chain
 *
 * @private
 * @param {object} resp HTTP response
 * @param {function} callback `{string}` err, `{object}` {certificate, intermediate, chain}
 */

AcmeClient.prototype.__downloadCertChain = function(resp, callback) {
    /* Require location header */
    if (!resp.headers.location) {
        return callback('Signing the certificate did not return a certificate link');
    }

    /* Download certificate */
    var jobs = { certificate: async.apply(this.__downloadCert.bind(this), resp.headers.location) };

    /* Read links */
    var links = helper.linkParser(resp.headers);

    /* Download intermediate certificate */
    if (links.up) {
        jobs.intermediate = async.apply(this.__downloadCert.bind(this), links.up);
    }

    /* Download certificates */
    async.series(jobs, function(err, result) {
        if (err) return callback(err);

        /* Create chain certificate */
        if (result.intermediate && result.certificate) {
            result.chain = new Buffer(result.certificate + result.intermediate);
        }

        callback(null, result);
    });
};


/**
 * Get chain of certificates
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#downloading-the-certificate
 *
 * @param {buffer|string} csr PEM encoded Certificate Signing Request
 * @param {object} [data] Additional request data
 * @param {function} callback `{string}` err, `{object}` {certificate, intermediate, chain}
 */

AcmeClient.prototype.getCertificateChain = function(csr, data, callback) {
    if (typeof callback === 'undefined') {
        callback = data;
        data = {};
    }

    var self = this;

    if (!Buffer.isBuffer(csr)) {
        csr = new Buffer(csr);
    }

    async.waterfall([
        /* Convert CSR to DER encoding */
        async.apply(openssl.pem2der, csr),

        /* Make request */
        function(derCsr, done) {
            data.csr = helper.b64encode(derCsr);
            self.api.newCert(data, done);
        }
    ], function(err, resp) {
        if (err) return callback(err);

        /* Download certificates */
        self.__downloadCertChain(resp, callback);
    });
};


/**
 * Revoke certificate
 *
 * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#certificate-revocation
 *
 * @param {buffer|string} cert PEM encoded certificate
 * @param {object} [data] Additional request data
 * @param {function} callback `{string}` err
 */

AcmeClient.prototype.revokeCertificate = function(cert, data, callback) {
    if (typeof callback === 'undefined') {
        callback = data;
        data = {};
    }

    var self = this;

    async.waterfall([
        /* Convert certificate to DER encoding */
        async.apply(openssl.pem2der, cert),

        /* Make request */
        function(derCert, done) {
            data.certificate = helper.b64encode(derCert);

            self.api.revokeCert(data, function(err, resp, body) {
                if (err) return done(err);
                done(null, body);
            });
        }
    ], callback);
};


/**
 * Easy mode
 *
 * @param {object} opts Options
 * @param {buffer|string} opts.csr Certificate Signing Request
 * @param {function} opts.challengeCreateFn Function to trigger before completing ACME challenge
 * @param {function} opts.challengeRemoveFn Function to trigger after completing ACME challenge
 * @param {string} [opts.email] Account email address
 * @param {string} [opts.challengeType] Wanted ACME challenge type, default: `http-01`
 * @param {function} callback `{string}` err, `{object}` {certificate, intermediate, chain}
 */

AcmeClient.prototype.easy = function(opts, callback) {
    easy(this, opts, callback);
};


/* Expose client */
module.exports = AcmeClient;
