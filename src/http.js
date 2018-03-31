/*
 * ACME HTTP client
 */

const crypto = require('crypto');
const os = require('os');
const request = require('request-promise-native');
const debug = require('debug')('acme-client');
const openssl = require('./openssl');
const helper = require('./helper');
const pkg = require('./../package.json');


/**
 * ACME HTTP client
 *
 * @class
 * @param {string} directoryUri Directory URL to the ACME provider
 * @param {buffer} accountKey PEM encoded private account key
 */

class HttpClient {
    constructor(directoryUri, accountKey) {
        this.directoryUri = directoryUri;
        this.accountKey = accountKey;

        this.directory = null;
        this.jwk = null;
    }


    /**
     * HTTP request
     *
     * @param {string} uri HTTP URI
     * @param {string} method HTTP method
     * @param {object} [opts] Request options
     * @returns {Promise} Response
     */

    async request(uri, method, opts = {}) {
        opts.uri = uri;
        opts.method = method;

        opts.simple = false;
        opts.resolveWithFullResponse = true;

        if (typeof opts.json === 'undefined') {
            opts.json = true;
        }

        if (typeof opts.headers === 'undefined') {
            opts.headers = {};
        }

        opts.headers['User-Agent'] = `${pkg.name}/${pkg.version} (${os.type()} ${os.release()})`;

        debug(`HTTP request: ${method} ${uri}`);
        const resp = await request(opts);

        debug(`RESP ${resp.statusCode} ${method} ${uri}`);
        return resp;
    }


    /**
     * Ensure provider directory exists
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#directory
     *
     * @returns {Promise}
     */

    async getDirectory() {
        if (!this.directory) {
            const resp = await this.request(this.directoryUri, 'GET');
            this.directory = resp.body;
        }
    }


    /**
     * Get JSON Web Key
     *
     * @returns {Promise} {e, kty, n}
     */

    async getJwk() {
        if (this.jwk) {
            return this.jwk;
        }

        const exponent = await openssl.getPublicExponent(this.accountKey);
        const modulus = await openssl.getModulus(this.accountKey);

        this.jwk = {
            e: helper.b64encode(exponent),
            kty: 'RSA',
            n: helper.b64encode(modulus)
        };

        return this.jwk;
    }


    /**
     * Get nonce from directory API endpoint
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#getting-a-nonce
     *
     * @returns {Promise} nonce
     */

    async getNonce() {
        const resp = await this.request(this.directoryUri, 'HEAD');

        if (!resp.headers['replay-nonce']) {
            throw new Error('Failed to get nonce from ACME provider');
        }

        return resp.headers['replay-nonce'];
    }


    /**
     * Get URI for a directory resource
     *
     * @param {string} resource API resource name
     * @returns {Promise} uri
     */

    async getResourceUri(resource) {
        await this.getDirectory();

        if (!this.directory[resource]) {
            throw new Error(`Could not resolve URI for API resource: "${resource}"`);
        }

        return this.directory[resource];
    }


    /**
     * Create signed HTTP request body
     *
     * @param {object} payload Request payload
     * @param {string} [nonce] Request nonce
     * @returns {Promise} body
     */

    async createSignedBody(payload, nonce = null) {
        const protectedOpts = {};

        /* Request header */
        const result = {
            header: {
                alg: 'RS256',
                jwk: await this.getJwk()
            }
        };

        if (nonce) {
            debug(`Using nonce: ${nonce}`);
            protectedOpts.nonce = nonce;
        }

        /* Request payload */
        const protectedObj = Object.assign({}, result.header, protectedOpts);
        result.payload = helper.b64encode(JSON.stringify(payload));
        result.protected = helper.b64encode(JSON.stringify(protectedObj));

        /* Signature */
        const signer = crypto.createSign('RSA-SHA256').update(`${result.protected}.${result.payload}`, 'utf8');
        result.signature = helper.b64escape(signer.sign(this.accountKey, 'base64'));

        return result;
    }


    /**
     * Signed HTTP request
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#request-authentication
     *
     * @param {string} uri HTTP URI
     * @param {string} method HTTP method
     * @param {object} payload Request payload
     * @returns {Promise} Response
     */

    async signedRequest(uri, method, payload) {
        const nonce = await this.getNonce();
        const body = await this.createSignedBody(payload, nonce);
        return this.request(uri, method, { body });
    }
}


/* Export client */
module.exports = HttpClient;
