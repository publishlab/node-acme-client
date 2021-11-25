/**
 * ACME challenge verification
 */

const Promise = require('bluebird');
const dns = Promise.promisifyAll(require('dns'));
const debug = require('debug')('acme-client');
const axios = require('./axios');


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

    debug(`Sending HTTP query to ${authz.identifier.value}, suffix: ${suffix}, port: ${httpPort}`);
    const resp = await axios.get(challengeUrl);
    const data = (resp.data || '').replace(/\s+$/, '');

    debug(`Query successful, HTTP status code: ${resp.status}`);

    if (!data || (data !== keyAuthorization)) {
        throw new Error(`Authorization not found in HTTP response from ${authz.identifier.value}`);
    }

    debug(`Key authorization match for ${challenge.type}/${authz.identifier.value}, ACME challenge verified`);
    return true;
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
    const RETRIES = 10;
    const RETRY_WAIT_MS = 1000;

    async function buildResolver(hostname) {
        const ips = await dns.resolve4Async(hostname);
        debug(`Building resolver for ${hostname} at ${ips}`);
        const resolver = new dns.Resolver();
        resolver.setServers(ips);
        return resolver;
    }

    async function verifyNameServer(hostname, dnsChallenge, myFunction, resolver) {
        function sleep(milliseconds) {
            return new Promise((resolve) => setTimeout(resolve, milliseconds));
        }

        let results = [];
        let i = 0;
        while (results.indexOf(dnsChallenge) < 0 && i < RETRIES) {
            await sleep(RETRY_WAIT_MS);

            results = await resolver[myFunction](hostname);
            results = [].concat(...results);
            debug(`Found records ${results} by ${resolver.getServers()}`);
            i += 1;
        }
        return i !== RETRIES;
    }

    const domain = authz.identifier.value;

    debug(`Resolving DNS TXT records for ${domain}, prefix: ${prefix}`);
    let challengeRecord = `${prefix}${domain}`;

    // find name servers
    const nameServers = await dns.resolveNsAsync(domain);
    debug(`Obtained name servers ${nameServers} for domain ${domain}`);
    const resolvers = await Promise.mapSeries(nameServers, buildResolver);

    try {
        /* Attempt CNAME record first */
        debug(`Checking CNAME for record ${challengeRecord}`);
        const cnameRecords = await dns.resolveCnameAsync(challengeRecord);

        if (cnameRecords.length) {
            debug(`CNAME found at ${challengeRecord}, new challenge record: ${cnameRecords[0]}`);
            challengeRecord = cnameRecords[0];
        }
    }
    catch (e) {
        debug(`No CNAME found for record ${challengeRecord}`);
    }

    /* Read TXT record */
    const results = await Promise.mapSeries(resolvers, verifyNameServer.bind(null, challengeRecord, keyAuthorization, 'resolveTxtAsync'));
    const isFound = results.reduce((a, b) => a && b);

    if (!isFound) {
        throw new Error(`Authorization not found in DNS TXT records for ${domain}`);
    }

    debug(`Key authorization match for ${challenge.type}/${domain}, ACME challenge verified`);
    return true;
}


/**
 * Export API
 */

module.exports = {
    'http-01': verifyHttpChallenge,
    'dns-01': verifyDnsChallenge
};
