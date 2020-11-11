/**
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
 * Split chain of PEM encoded objects from buffer or string into array
 *
 * @param {buffer|string} str PEM encoded buffer or string
 * @returns {array} Array of PEM bodies
 */

function splitPemChain(str) {
    const pemStr = Buffer.isBuffer(str) ? str.toString() : str;

    return pemStr.split(/\s*-----(?:BEGIN|END) [A-Z0-9- ]+-----/g)
        .filter((p) => p)
        .map((p) => p.replace(/\r|\n/g, ''));
}


/**
 * Parse body of PEM encoded object from buffer or string
 * If multiple objects are chained, the first body will be returned
 *
 * @param {buffer|string} str PEM encoded buffer or string
 * @returns {string} PEM body
 */

function getPemBody(str) {
    const chain = splitPemChain(str);

    if (!chain.length) {
        throw new Error('Unable to parse PEM body from string');
    }

    return chain[0];
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


/* Export utils */
module.exports = {
    retry,
    b64escape,
    b64encode,
    splitPemChain,
    getPemBody,
    formatResponseError
};
