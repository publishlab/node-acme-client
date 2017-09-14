/*
 * ACME easy mode helper
 */

var fmt = require('util').format;
var async = require('async');
var merge = require('merge').recursive;
var debug = require('debug')('acme-client');
var openssl = require('./openssl');


/**
 * Register account
 *
 * @private
 * @param {AcmeClient} client Client
 * @param {object} data Account data
 * @param {function} callback `{string}` err
 */

function registerAccount(client, data, callback) {
    debug('[easy] Registering account');

    client.registerAccount(data, function(err) {
        callback(err);
    });
}


/**
 * Register domain and select challenge
 *
 * @private
 * @param {AcmeClient} client Client
 * @param {object} opts Options
 * @param {string} domain Domain
 * @param {function} callback `{string}` err, `{object}` challenge
 */

function getDomainChallenge(client, opts, domain, callback) {
    debug('[easy] [%s] Grabbing domain challenge', domain);

    var domainData = {
        identifier: {
            type: 'dns',
            value: domain
        }
    };

    /* Register domain */
    client.registerDomain(domainData, function(err, result) {
        if (err) return callback(err);

        debug('[easy] [%s] Domain returned %d challenges', domain, result.challenges.length);

        /* Find wanted challenge */
        var challenge = result.challenges.filter(function(c) {
            return (c.type === opts.challengeType);
        }).pop();

        if (!challenge) {
            return callback(fmt('Unable to resolve challenge with type: %s', opts.challengeType));
        }

        /* Return challenge */
        debug('[easy] [%s] Found %s challenge with status: %s', domain, opts.challengeType, challenge.status);
        callback(null, challenge);
    });
}


/**
 * Satisfy the ACME challenge
 *
 * @private
 * @param {AcmeClient} client Client
 * @param {object} opts Options
 * @param {string} domain Domain
 * @param {object} challenge Challenge object
 * @param {function} callback `{string}` err, `{object}` challenge
 */

function completeChallenge(client, opts, domain, challenge, callback) {
    async.waterfall([
        /* Get challenge key authorization */
        async.apply(client.getChallengeKeyAuthorization.bind(client), challenge),

        /* Trigger challenge create function */
        function(keyAuthorization, done) {
            debug('[easy] [%s] Got key authorization for challenge, running challengeCreateFn()', domain);

            opts.challengeCreateFn(keyAuthorization, challenge, domain, function(err, poll) {
                debug('[easy] [%s] challengeCreateFn() returned', domain);
                done(err, poll);
            });
        },

        /* Verify challenge before completing it if needed */
        function(poll, done) {
            if (poll && (poll.http || poll.https)) {
                var baseUri = poll.http || poll.https;

                debug('[easy] [%s] Received poll data type: http, checking URI for validation: %s', domain, baseUri);
                return client.verifyChallengeBaseUri(baseUri, challenge, done);
            }

            debug('[easy] [%s] Did not receive poll data from challengeCreateFn(), skipping validation', domain);
            done(null);
        },

        /* Notify ACME provider that challenge is complete */
        async.apply(client.completeChallenge.bind(client), challenge)
    ], callback);
}


/**
 * Handle single domain challenge
 *
 * @private
 * @param {AcmeClient} client Client
 * @param {object} opts Options
 * @param {string} domain Domain
 * @param {object} challenge Challenge object returned from API
 * @param {function} callback `{string}` err
 */

function handleDomainChallenge(client, opts, domain, challenge, callback) {
    /* Challenge already valid */
    if (challenge.status === 'valid') {
        debug('[easy] [%s] Challenge is already valid, moving on', domain);
        return callback(null);
    }

    debug('[easy] [%s] Attempting to satisfy challenge', domain);

    async.series([
        /* Satisfy challenge */
        async.apply(completeChallenge, client, opts, domain, challenge),

        /* Wait for valid challenge status */
        async.apply(client.waitForChallengeValidStatus.bind(client), challenge)
    ], function(challengeErr) {
        debug('[easy] [%s] Challenge handled, running challengeRemoveFn()', domain);

        /* Trigger challenge remove function */
        opts.challengeRemoveFn(challenge, domain, function(removeErr) {
            debug('[easy] [%s] challengeRemoveFn() returned', domain);
            callback(challengeErr || removeErr);
        });
    });
}


/**
 * Handle challenges for array of domains
 *
 * @private
 * @param {AcmeClient} client  ACME client
 * @param {object} opts Options
 * @param {array} domains Array of domains
 * @param {function} callback `{string}` err
 */

function handleDomainChallenges(client, opts, domains, callback) {
    var jobs = [];
    debug('[easy] Resolved %d domains from parsing the CSR', domains.length);

    domains.forEach(function(domain) {
        jobs.push(async.apply(async.waterfall, [
            /* Get domain challenge */
            async.apply(getDomainChallenge, client, opts, domain),

            /* Handle it */
            async.apply(handleDomainChallenge, client, opts, domain)
        ]));
    });

    async.series(jobs, function(err) {
        callback(err);
    });
}


/*
 * Default options
 */

var defaultOpts = {
    csr: null,
    email: null,
    challengeType: 'http-01',
    challengeCreateFn: function(keyAuthorization, challenge, domain, callback) {
        callback('Missing challengeCreateFn()');
    },
    challengeRemoveFn: function(challenge, domain, callback) {
        callback('Missing challengeRemoveFn()');
    }
};


/**
 * ACME easy mode helper
 *
 * @param {AcmeClient} client Client
 * @param {object} userOpts Options
 * @param {function} callback `{string}` err, `{object}` {certificate, intermediate, chain}
 */

module.exports = function(client, userOpts, callback) {
    var opts = merge(defaultOpts, userOpts);
    var accountData = {};

    if (!Buffer.isBuffer(opts.csr)) {
        opts.csr = new Buffer(opts.csr);
    }

    if (opts.email) {
        accountData.contact = [fmt('mailto:%s', opts.email)];
    }

    /* Run jobs */
    async.waterfall([
        /* Register account */
        async.apply(registerAccount, client, accountData),

        /* Parse domains from CSR */
        async.apply(openssl.readCsrDomains, opts.csr),

        /* Handle domain challenges */
        async.apply(handleDomainChallenges, client, opts),

        /* Get certificates */
        async.apply(client.getCertificateChain.bind(client), opts.csr)
    ], callback);
};
