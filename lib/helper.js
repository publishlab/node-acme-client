/*
 * Utility methods
 */

var b64escape;
var linkParser;


/**
 * Escape base64 encoded string
 *
 * @param {string} str Base64 encoded string
 * @returns {string} Escaped string
 */

b64escape = exports.b64escape = function(str) {
    return str
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};


/**
 * Base64 encode and escape buffer or string
 *
 * @param {buffer|string} str Buffer or string to be encoded
 * @returns {string} Escaped base64 encoded string
 */

exports.b64encode = function(str) {
    var buf = Buffer.isBuffer(str) ? str : new Buffer(str);
    return b64escape(buf.toString('base64'));
};


/**
 * Parse links from HTTP response headers
 *
 * @param {object} headers HTTP response headers
 * @returns {object} Links found from headers
 */

linkParser = exports.linkParser = function(headers) {
    if (!headers || !headers.link) {
        return {};
    }

    var result = {};
    var links = headers.link.split(/,/);

    links.forEach(function(link) {
        var matches = link.match(/<([^>]*)>;rel="([^"]*)"/);

        if (matches) {
            result[matches[2]] = matches[1];
        }
    });

    return result;
};


/**
 * Check if ACME Terms of Service needs to be accepted
 *
 * @param {object} payload HTTP request payload
 * @param {object} resp HTTP response object
 * @param {object} body HTTP response body
 * @return {boolean} True if ToS needs to be accepted
 */

exports.tosRequired = function(payload, resp, body) {
    var links = linkParser(resp.headers);
    var hasTosLink = (links && links['terms-of-service']);
    var hasPayloadAgreement = (Object.keys(payload).indexOf('agreement') !== -1);
    var hasBodyAgreement = (typeof body.agreement !== 'undefined');

    return hasTosLink && !hasPayloadAgreement && !hasBodyAgreement;
};
