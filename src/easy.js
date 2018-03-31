/*
 * ACME easy mode helper
 */

const Promise = require('bluebird');
const debug = require('debug')('acme-client');
const openssl = require('./openssl');


/**
 * Register domain and select challenge
 *
 * @private
 * @param {AcmeClient} client Client
 * @param {object} opts Options
 * @param {string} domain Domain
 * @returns {Promise} challenge
 */

async function getDomainChallenge(client, opts, domain) {
    debug(`[easy] [${domain}] Grabbing domain challenge`);

    /* Register domain */
    const result = await client.registerDomain({
        identifier: {
            type: 'dns',
            value: domain
        }
    });

    /* Find wanted challenge */
    debug(`[easy] [${domain}] Domain returned ${result.challenges.length} challenges`);
    const challenge = result.challenges.filter(c => c.type === opts.challengeType).pop();

    if (!challenge) {
        throw new Error(`Unable to resolve challenge with type: ${opts.challengeType}`);
    }

    debug(`[easy] [${domain}] Found ${opts.challengeType} challenge with status: ${challenge.status}`);
    return challenge;
}


/**
 * Satisfy the ACME challenge
 *
 * @private
 * @param {AcmeClient} client Client
 * @param {object} opts Options
 * @param {string} domain Domain
 * @param {object} challenge Challenge object
 * @returns {Promise} challenge
 */

async function completeChallenge(client, opts, domain, challenge) {
    /* Get key authorization */
    const keyAuthorization = await client.getChallengeKeyAuthorization(challenge);
    debug(`[easy] [${domain}] Got key authorization for challenge, running challengeCreateFn()`);

    /* Trigger create function */
    const result = await opts.challengeCreateFn(keyAuthorization, challenge, domain);

    /* Verify challenge before completing if needed */
    if (result && (result.http || result.https)) {
        const baseUri = result.http || result.https;

        debug(`[easy] [${domain}] Received poll data type: http, checking URI for validation: ${baseUri}`);
        await client.verifyChallengeBaseUri(baseUri, challenge);
    }
    else {
        debug(`[easy] [${domain}] Did not receive poll data from challengeCreateFn(), skipping validation`);
    }

    /* Notify ACME provider that the challenge is complete */
    return client.completeChallenge(challenge);
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

async function handleDomainChallenge(client, opts, domain, challenge) {
    /* Challenge already valid */
    if (challenge.status === 'valid') {
        debug(`[easy] [${domain}] Challenge is already valid, moving on`);
        return;
    }

    try {
        /* Satisfy challenge */
        debug(`[easy] [${domain}] Attempting to satisfy challenge`);
        await completeChallenge(client, opts, domain, challenge);

        /* Wait for valid challenge status */
        await client.waitForChallengeValidStatus(challenge);
    }
    catch (e) {
        throw e;
    }
    finally {
        /* Trigger remove function */
        debug(`[easy] [${domain}] Challenge handled, running challengeRemoveFn()`);
        await opts.challengeRemoveFn(challenge, domain);
    }
}


/**
 * Handle challenges for array of domains
 *
 * @private
 * @param {AcmeClient} client  ACME client
 * @param {object} opts Options
 * @param {object} csrDomains Object of domains
 * @returns {Promise}
 */

async function handleDomainChallenges(client, opts, csrDomains) {
    const domains = [csrDomains.commonName].concat(csrDomains.altNames);
    debug(`[easy] Resolved ${domains.length} domains from parsing the CSR`);

    await Promise.each(domains, async (domain) => {
        const challenge = await getDomainChallenge(client, opts, domain);
        await handleDomainChallenge(client, opts, domain, challenge);
    });
}


/*
 * Default options
 */

const defaultOpts = {
    csr: null,
    email: null,
    challengeType: 'http-01',
    challengeCreateFn: async () => {
        throw new Error('Missing challengeCreateFn()');
    },
    challengeRemoveFn: async () => {
        throw new Error('Missing challengeRemoveFn()');
    }
};


/**
 * ACME easy mode helper
 *
 * @param {AcmeClient} client Client
 * @param {object} userOpts Options
 * @returns {Promise} {certificate, intermediate, chain}
 */

module.exports = async function(client, userOpts) {
    const opts = Object.assign({}, defaultOpts, userOpts);
    const accountData = {};

    if (!Buffer.isBuffer(opts.csr)) {
        opts.csr = Buffer.from(opts.csr);
    }

    if (opts.email) {
        accountData.contact = [`mailto:${opts.email}`];
    }

    /* Register account */
    debug('[easy] Registering account');
    await client.registerAccount(accountData);

    /* Parse domains and handle challenges */
    const domains = await openssl.readCsrDomains(opts.csr);
    await handleDomainChallenges(client, opts, domains);

    /* Get certificates */
    return client.getCertificateChain(opts.csr);
};
