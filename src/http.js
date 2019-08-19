/**
 * ACME HTTP client
 */

const crypto = require('crypto');
const os = require('os');
const axios = require('axios');
const debug = require('debug')('acme-client');
const helper = require('./helper');
const forge = require('./crypto/forge');
const pkg = require('./../package.json');

const userAgentString = `node-${pkg.name}/${pkg.version} (${os.type()} ${os.release()})`;


/**
 * ACME HTTP client
 *
 * @class
 * @param {string} directoryUrl ACME directory URL
 * @param {buffer} accountKey PEM encoded account private key
 */

class HttpClient {
    constructor(directoryUrl, accountKey) {
        this.directoryUrl = directoryUrl;
        this.accountKey = accountKey;

        this.directory = null;
        this.jwk = null;
    }


    /**
     * HTTP request
     *
     * @param {string} url HTTP URL
     * @param {string} method HTTP method
     * @param {object} [opts] Request options
     * @returns {Promise<object>} HTTP response
     */

    async request(url, method, opts = {}) {
        opts.url = url;
        opts.method = method;
        opts.validateStatus = null;

        if (typeof opts.headers === 'undefined') {
            opts.headers = {};
        }

        opts.headers['Content-Type'] = 'application/jose+json';
        opts.headers['User-Agent'] = userAgentString;

        debug(`HTTP request: ${method} ${url}`);
        const resp = await axios.request(opts);

        debug(`RESP ${resp.status} ${method} ${url}`);
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
            const resp = await this.request(this.directoryUrl, 'get');
            this.directory = resp.data;
        }
    }


    /**
     * Get JSON Web Key
     *
     * @returns {Promise<object>} {e, kty, n}
     */

    async getJwk() {
        if (this.jwk) {
            return this.jwk;
        }

        const exponent = await forge.getPublicExponent(this.accountKey);
        const modulus = await forge.getModulus(this.accountKey);

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
     * @returns {Promise<string>} nonce
     */

    async getNonce() {
        const url = await this.getResourceUrl('newNonce');
        const resp = await this.request(url, 'head');

        if (!resp.headers['replay-nonce']) {
            throw new Error('Failed to get nonce from ACME provider');
        }

        return resp.headers['replay-nonce'];
    }


    /**
     * Get URL for a directory resource
     *
     * @param {string} resource API resource name
     * @returns {Promise<string>} URL
     */

    async getResourceUrl(resource) {
        await this.getDirectory();

        if (!this.directory[resource]) {
            throw new Error(`Could not resolve URL for API resource: "${resource}"`);
        }

        return this.directory[resource];
    }


    /**
     * Create signed HTTP request body
     *
     * @param {string} url Request URL
     * @param {object} payload Request payload
     * @param {string} [nonce] Request nonce
     * @returns {Promise<object>} Signed HTTP request body
     */

    async createSignedBody(url, payload, nonce = null, kid = null) {
        /* JWS header */
        const header = {
            url,
            alg: 'RS256'
        };

        if (nonce) {
            debug(`Using nonce: ${nonce}`);
            header.nonce = nonce;
        }

        /* KID or JWK */
        if (kid) {
            header.kid = kid;
        }
        else {
            header.jwk = await this.getJwk();
        }

        /* Request payload */
        let result;
        if (payload === '') {
            result = {
                payload: '',
                protected: util.b64encode(JSON.stringify(header))
            };
        }
        else {
            result = {
                payload: util.b64encode(JSON.stringify(payload)),
                protected: util.b64encode(JSON.stringify(header))
            };
        }

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
     * @param {string} url Request URL
     * @param {string} method HTTP method
     * @param {object} payload Request payload
     * @param {string} [kid] KID
     * @returns {Promise<object>} HTTP response
     */

    async signedRequest(url, method, payload, kid = null) {
        const nonce = await this.getNonce();
        const data = await this.createSignedBody(url, payload, nonce, kid);
        return this.request(url, method, { data });
    }
}


/* Export client */
module.exports = HttpClient;
