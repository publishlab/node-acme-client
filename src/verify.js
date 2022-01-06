/**
 * ACME challenge verification
 */

const Promise = require('bluebird');
const dns = Promise.promisifyAll(require('dns'));
const { log } = require('./logger');
const axios = require('./axios');
const util = require('./util');


/**
 * Verify ACME HTTP challenge
 *
 * https://tools.ietf.org/html/rfc8555#section-8.3
 *
 * @param {object} authz Identifier authorization
 * @param {object} challenge Authorization challenge
 * @param {string} keyAuthorization Challenge key authorization
 * @param {string} [suffix] URL suffix
 * @returns {Promise<boolean>}
 */

async function verifyHttpChallenge(authz, challenge, keyAuthorization, suffix = `/.well-known/acme-challenge/${challenge.token}`) {
    const httpPort = axios.defaults.acmeSettings.httpChallengePort || 80;
    const challengeUrl = `http://${authz.identifier.value}:${httpPort}${suffix}`;

    log(`Sending HTTP query to ${authz.identifier.value}, suffix: ${suffix}, port: ${httpPort}`);
    const resp = await axios.get(challengeUrl);
    const data = (resp.data || '').replace(/\s+$/, '');

    log(`Query successful, HTTP status code: ${resp.status}`);

    if (!data || (data !== keyAuthorization)) {
        throw new Error(`Authorization not found in HTTP response from ${authz.identifier.value}`);
    }

    log(`Key authorization match for ${challenge.type}/${authz.identifier.value}, ACME challenge verified`);
    return true;
}


/**
 * Walk DNS until TXT records are found
 */

async function walkDnsChallengeRecord(recordName) {
    /* Attempt CNAME record first */
    try {
        log(`Checking name for CNAME records: ${recordName}`);
        const cnameRecords = await dns.resolveCnameAsync(recordName);

        if (cnameRecords.length) {
            log(`CNAME record found at ${recordName}, new challenge record name: ${cnameRecords[0]}`);
            return walkDnsChallengeRecord(cnameRecords[0]);
        }
    }
    catch (e) {
        log(`No CNAME records found for name: ${recordName}`);
    }

    /* TXT using default resolver */
    try {
        log(`Checking name for TXT records: ${recordName}`);
        const txtRecords = await dns.resolveTxtAsync(recordName);

        if (txtRecords.length) {
            log(`Found ${txtRecords.length} TXT records at ${recordName}`);
            return [].concat(...txtRecords);
        }
    }
    catch (e) {
        log(`No TXT records found for name: ${recordName}`);
    }

    /* TXT using authoritative NS */
    try {
        log(`Checking name for TXT records using authoritative NS: ${recordName}`);
        const resolver = await util.getAuthoritativeDnsResolver(recordName);
        const txtRecords = await resolver.resolveTxtAsync(recordName);

        if (txtRecords.length) {
            log(`Found ${txtRecords.length} TXT records using authoritative NS at ${recordName}`);
            return [].concat(...txtRecords);
        }
    }
    catch (e) {
        log(`No TXT records found using authoritative NS for name: ${recordName}`);
    }

    /* Found nothing */
    throw new Error(`No TXT records found for name: ${recordName}`);
}


/**
 * Verify ACME DNS challenge
 *
 * https://tools.ietf.org/html/rfc8555#section-8.4
 *
 * @param {object} authz Identifier authorization
 * @param {object} challenge Authorization challenge
 * @param {string} keyAuthorization Challenge key authorization
 * @param {string} [prefix] DNS prefix
 * @returns {Promise<boolean>}
 */

async function verifyDnsChallenge(authz, challenge, keyAuthorization, prefix = '_acme-challenge.') {
    const recordName = `${prefix}${authz.identifier.value}`;
    log(`Resolving DNS TXT from record: ${recordName}`);

    const recordValues = await walkDnsChallengeRecord(recordName);
    log(`DNS query finished successfully, found ${recordValues.length} TXT records`);

    if (!recordValues.includes(keyAuthorization)) {
        throw new Error(`Authorization not found in DNS TXT record: ${recordName}`);
    }

    log(`Key authorization match for ${challenge.type}/${recordName}, ACME challenge verified`);
    return true;
}


/**
 * Export API
 */

module.exports = {
    'http-01': verifyHttpChallenge,
    'dns-01': verifyDnsChallenge
};
