/**
 * Utility methods
 */

const dns = require('dns').promises;
const Backoff = require('backo2');
const { readCertificateInfo, splitPemChain } = require('./crypto');
const { log } = require('./logger');


/**
 * Retry promise
 *
 * @param {function} fn Function returning promise that should be retried
 * @param {number} attempts Maximum number of attempts
 * @param {Backoff} backoff Backoff instance
 * @returns {Promise}
 */

async function retryPromise(fn, attempts, backoff) {
    let aborted = false;

    try {
        const data = await fn(() => { aborted = true; });
        return data;
    }
    catch (e) {
        if (aborted || ((backoff.attempts + 1) >= attempts)) {
            throw e;
        }

        const duration = backoff.duration();
        log(`Promise rejected attempt #${backoff.attempts}, retrying in ${duration}ms: ${e.message}`);

        await new Promise((resolve) => { setTimeout(resolve, duration); });
        return retryPromise(fn, attempts, backoff);
    }
}


/**
 * Retry promise
 *
 * @param {function} fn Function returning promise that should be retried
 * @param {object} [backoffOpts] Backoff options
 * @param {number} [backoffOpts.attempts] Maximum number of attempts, default: `5`
 * @param {number} [backoffOpts.min] Minimum attempt delay in milliseconds, default: `5000`
 * @param {number} [backoffOpts.max] Maximum attempt delay in milliseconds, default: `30000`
 * @returns {Promise}
 */

function retry(fn, { attempts = 5, min = 5000, max = 30000 } = {}) {
    const backoff = new Backoff({ min, max });
    return retryPromise(fn, attempts, backoff);
}


/**
 * Parse URLs from link header
 *
 * @param {string} header Link header contents
 * @param {string} rel Link relation, default: `alternate`
 * @returns {array} Array of URLs
 */

function parseLinkHeader(header, rel = 'alternate') {
    const relRe = new RegExp(`\\s*rel\\s*=\\s*"?${rel}"?`, 'i');

    const results = (header || '').split(/,\s*</).map((link) => {
        const [, linkUrl, linkParts] = link.match(/<?([^>]*)>;(.*)/) || [];
        return (linkUrl && linkParts && linkParts.match(relRe)) ? linkUrl : null;
    });

    return results.filter((r) => r);
}


/**
 * Find certificate chain with preferred issuer
 * If issuer can not be located, the first certificate will be returned
 *
 * @param {array} certificates Array of PEM encoded certificate chains
 * @param {string} issuer Preferred certificate issuer
 * @returns {string} PEM encoded certificate chain
 */

function findCertificateChainForIssuer(chains, issuer) {
    const match = chains.find((chain) => {
        /* Look up all issuers */
        const certs = splitPemChain(chain);
        const infoCollection = certs.map((c) => readCertificateInfo(c));
        const issuerCollection = infoCollection.map((i) => i.issuer.commonName);

        /* Found match, return chain */
        if (issuerCollection.includes(issuer)) {
            log(`Found matching certificate for preferred issuer="${issuer}", issuers=${JSON.stringify(issuerCollection)}`);
            return chain;
        }

        /* No match, return nothing */
        log(`Unable to match certificate for preferred issuer="${issuer}", issuers=${JSON.stringify(issuerCollection)}`);
        return null;
    });

    /* Return first non-null */
    if (match) {
        return match;
    }

    /* No certificates matched, return default */
    log(`Found no match in ${chains.length} certificate chains for preferred issuer="${issuer}", returning default certificate chain`);
    return chains[0];
}


/**
 * Find and format error in response object
 *
 * @param {object} resp HTTP response
 * @returns {string} Error message
 */

function formatResponseError(resp) {
    let result;

    if (resp.data.error) {
        result = resp.data.error.detail || resp.data.error;
    }
    else {
        result = resp.data.detail || JSON.stringify(resp.data);
    }

    return result.replace(/\n/g, '');
}


/**
 * Resolve root domain name by looking for SOA record
 *
 * @param {string} recordName DNS record name
 * @returns {Promise<string>} Root domain name
 */

async function resolveDomainBySoaRecord(recordName) {
    try {
        await dns.resolveSoa(recordName);
        log(`Found SOA record, considering domain to be: ${recordName}`);
        return recordName;
    }
    catch (e) {
        log(`Unable to locate SOA record for name: ${recordName}`);
        const parentRecordName = recordName.split('.').slice(1).join('.');

        if (!parentRecordName.includes('.')) {
            throw new Error('Unable to resolve domain by SOA record');
        }

        return resolveDomainBySoaRecord(parentRecordName);
    }
}


/**
 * Get DNS resolver using domains authoritative NS records
 *
 * @param {string} recordName DNS record name
 * @returns {Promise<dns.Resolver>} DNS resolver
 */

async function getAuthoritativeDnsResolver(recordName) {
    log(`Locating authoritative NS records for name: ${recordName}`);
    const resolver = new dns.Resolver();

    try {
        /* Resolve root domain by SOA */
        const domain = await resolveDomainBySoaRecord(recordName);

        /* Resolve authoritative NS addresses */
        log(`Looking up authoritative NS records for domain: ${domain}`);
        const nsRecords = await dns.resolveNs(domain);
        const nsAddrArray = await Promise.all(nsRecords.map(async (r) => dns.resolve4(r)));
        const nsAddresses = [].concat(...nsAddrArray).filter((a) => a);

        if (!nsAddresses.length) {
            throw new Error(`Unable to locate any valid authoritative NS addresses for domain: ${domain}`);
        }

        /* Authoritative NS success */
        log(`Found ${nsAddresses.length} authoritative NS addresses for domain: ${domain}`);
        resolver.setServers(nsAddresses);
    }
    catch (e) {
        log(`Authoritative NS lookup error: ${e.message}`);
    }

    /* Return resolver */
    const addresses = resolver.getServers();
    log(`DNS resolver addresses: ${addresses.join(', ')}`);

    return resolver;
}


/**
 * Export utils
 */

module.exports = {
    retry,
    parseLinkHeader,
    findCertificateChainForIssuer,
    formatResponseError,
    getAuthoritativeDnsResolver
};
