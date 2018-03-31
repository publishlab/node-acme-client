/*
 * Utility methods
 */

const Promise = require('bluebird');
const Backoff = require('backo2');
const debug = require('debug')('acme-client');


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
        debug(`Promise rejected attempt #${backoff.attempts}, retrying in ${duration}ms: ${e.message}`);

        await Promise.delay(duration);
        return retryPromise(fn, attempts, backoff);
    }
}


/**
 * Retry promise
 *
 * @param {function} fn Function returning promise that should be retried
 * @param {object} backoffOpts Backoff options
 * @param {number} backoffOpts.attempts Maximum number of attempts
 * @param {number} backoffOpts.min Minimum attempt delay in milliseconds
 * @param {number} backoffOpts.max Maximum attempt delay in milliseconds
 * @returns {Promise}
 */

function retry(fn, { attempts = 5, min = 5000, max = 30000 } = {}) {
    const backoff = new Backoff({ min, max });
    return retryPromise(fn, attempts, backoff);
}


/**
 * Escape base64 encoded string
 *
 * @param {string} str Base64 encoded string
 * @returns {string} Escaped string
 */

function b64escape(str) {
    return str.replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}


/**
 * Base64 encode and escape buffer or string
 *
 * @param {buffer|string} str Buffer or string to be encoded
 * @returns {string} Escaped base64 encoded string
 */

function b64encode(str) {
    const buf = Buffer.isBuffer(str) ? str : Buffer.from(str);
    return b64escape(buf.toString('base64'));
}


/**
 * Parse links from HTTP response headers
 *
 * @param {object} headers HTTP response headers
 * @returns {object} Links found from headers
 */

function linkParser(headers) {
    if (!headers || !headers.link) {
        return {};
    }

    const result = {};
    const links = headers.link.split(/,/);

    links.forEach((link) => {
        const matches = link.match(/<([^>]*)>;rel="([^"]*)"/);

        if (matches) {
            result[matches[2]] = matches[1];
        }
    });

    return result;
}


/**
 * Check if ACME Terms of Service needs to be accepted
 *
 * @param {object} payload HTTP request payload
 * @param {object} resp HTTP response object
 * @return {boolean} True if ToS needs to be accepted
 */

function tosRequired(payload, resp) {
    const links = linkParser(resp.headers);
    const hasTosLink = (links && links['terms-of-service']);
    const hasPayloadAgreement = (Object.keys(payload).indexOf('agreement') !== -1);
    const hasBodyAgreement = (typeof resp.body.agreement !== 'undefined');

    return hasTosLink && !hasPayloadAgreement && !hasBodyAgreement;
}


/* Export utils */
module.exports = {
    retry,
    b64escape,
    b64encode,
    linkParser,
    tosRequired
};
