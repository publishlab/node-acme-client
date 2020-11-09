/**
 * ACME API client
 */
const crypto = require('crypto');
const util = require('./util');


/**
 * AcmeApi
 *
 * @class
 * @param {HttpClient} httpClient
 */

class AcmeApi {
    constructor(httpClient, accountUrl = null, externalAccountBinding = null) {
        this.http = httpClient;
        this.accountUrl = accountUrl;
        if (externalAccountBinding && externalAccountBinding.kid && externalAccountBinding.key) {
            this.eabKid = externalAccountBinding.kid;
            this.eabKey = externalAccountBinding.key;
        }
    }


    /**
     * Get account URL
     *
     * @private
     * @returns {string} Account URL
     */

    getAccountUrl() {
        if (!this.accountUrl) {
            throw new Error('No account URL found, register account first');
        }

        return this.accountUrl;
    }


    /**
     * ACME API request
     *
     * @private
     * @param {string} url Request URL
     * @param {object} [payload] Request payload, default: `null`
     * @param {array} [validStatusCodes] Array of valid HTTP response status codes, default: `[]`
     * @param {boolean} [jwsKid] Use KID in JWS header, default: `true`
     * @returns {Promise<object>} HTTP response
     */

    async apiRequest(url, payload = null, validStatusCodes = [], jwsKid = true) {
        const kid = jwsKid ? this.getAccountUrl() : null;
        const resp = await this.http.signedRequest(url, payload, kid);

        if (validStatusCodes.length && (validStatusCodes.indexOf(resp.status) === -1)) {
            throw new Error(util.formatResponseError(resp));
        }

        return resp;
    }


    /**
     * ACME API request by resource name helper
     *
     * @private
     * @param {string} resource Request resource name
     * @param {object} [payload] Request payload, default: `null`
     * @param {array} [validStatusCodes] Array of valid HTTP response status codes, default: `[]`
     * @param {boolean} [jwsKid] Use KID in JWS header, default: `true`
     * @returns {Promise<object>} HTTP response
     */

    async apiResourceRequest(resource, payload = null, validStatusCodes = [], jwsKid = true) {
        const resourceUrl = await this.http.getResourceUrl(resource);
        return this.apiRequest(resourceUrl, payload, validStatusCodes, jwsKid);
    }


    /**
     * Get Terms of Service URL if available
     *
     * https://tools.ietf.org/html/rfc8555#section-7.1.1
     *
     * @returns {Promise<string|null>} ToS URL
     */

    async getTermsOfServiceUrl() {
        return this.http.getMetaField('termsOfService');
    }


    /**
     * Create new account
     *
     * https://tools.ietf.org/html/rfc8555#section-7.3
     *
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    async createAccount(data) {
        const resource = 'newAccount';
        const payload = { ...data };

        // Add externalAccountBinding info if present
        // TODO: fold into generic http function
        if (this.eabKey && this.eabKid) {
            const url = await this.http.getResourceUrl(resource);
            /* EAB JWS header */
            const eabHeader = {
                url,
                alg: 'HS256',
                kid: this.eabKid
            };
            /* EAB JWS payload which is just the outer JWS's jwk field in base64 */
            const accJwk = await this.http.getJwk();
            const eabPayload = util.b64encode(JSON.stringify(accJwk));

            const eabJws = {
                protected: util.b64encode(JSON.stringify(eabHeader)),
                payload: eabPayload
            };

            /*
            Signature with HMAC256
            See: https://github.com/auth0/node-jwa/blob/8ddd78abc5ebfbb7914e3d1ce5edae1e69f74e8d/index.js#L128
            */
            const signature = crypto.createHmac('sha256', this.eabKey)
                .update(`${eabJws.protected}.${eabJws.payload}`, 'utf8')
                .digest('base64');

            payload.externalAccountBinding = {
                ...eabJws,
                signature
            };
        }

        const resp = await this.apiResourceRequest(resource, payload, [200, 201], false);

        /* Set account URL */
        if (resp.headers.location) {
            this.accountUrl = resp.headers.location;
        }

        return resp;
    }


    /**
     * Update account
     *
     * https://tools.ietf.org/html/rfc8555#section-7.3.2
     *
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    updateAccount(data) {
        return this.apiRequest(this.getAccountUrl(), data, [200, 202]);
    }


    /**
     * Update account key
     *
     * https://tools.ietf.org/html/rfc8555#section-7.3.5
     *
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    updateAccountKey(data) {
        return this.apiResourceRequest('keyChange', data, [200]);
    }


    /**
     * Create new order
     *
     * https://tools.ietf.org/html/rfc8555#section-7.4
     *
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    createOrder(data) {
        return this.apiResourceRequest('newOrder', data, [201]);
    }


    /**
     * Finalize order
     *
     * https://tools.ietf.org/html/rfc8555#section-7.4
     *
     * @param {string} url Finalization URL
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    finalizeOrder(url, data) {
        return this.apiRequest(url, data, [200]);
    }


    /**
     * Get identifier authorization
     *
     * https://tools.ietf.org/html/rfc8555#section-7.5
     *
     * @param {string} url Authorization URL
     * @returns {Promise<object>} HTTP response
     */

    getAuthorization(url) {
        return this.apiRequest(url, null, [200]);
    }


    /**
     * Update identifier authorization
     *
     * https://tools.ietf.org/html/rfc8555#section-7.5.2
     *
     * @param {string} url Authorization URL
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    updateAuthorization(url, data) {
        return this.apiRequest(url, data, [200]);
    }


    /**
     * Complete challenge
     *
     * https://tools.ietf.org/html/rfc8555#section-7.5.1
     *
     * @param {string} url Challenge URL
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    completeChallenge(url, data) {
        return this.apiRequest(url, data, [200]);
    }


    /**
     * Revoke certificate
     *
     * https://tools.ietf.org/html/rfc8555#section-7.6
     *
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    revokeCert(data) {
        return this.apiResourceRequest('revokeCert', data, [200]);
    }
}


/* Export API */
module.exports = AcmeApi;
