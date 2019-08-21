/**
 * ACME API client
 */

const util = require('./util');


/**
 * AcmeApi
 *
 * @class
 * @param {HttpClient} httpClient
 */

class AcmeApi {
    constructor(httpClient, accountUrl = null) {
        this.http = httpClient;
        this.accountUrl = accountUrl;
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
     * ACME API HTTP request
     *
     * @private
     * @param {object} payload Request payload
     * @param {string} resource Request resource
     * @param {array} [validStatusCodes] Array of valid HTTP response status codes, default: `[]`
     * @param {boolean} [jwsKid] Use KID in JWS header, default: `true`
     * @param {string} [url] HTTP request url
     * @returns {Promise<object>} HTTP response
     */

    async apiRequest(payload, resource, validStatusCodes = [], jwsKid = true, url = null) {
        if (!url) {
            url = await this.http.getResourceUrl(resource);
        }

        const kid = jwsKid ? this.getAccountUrl() : null;
        const resp = await this.http.signedRequest(url, payload, kid);

        if (validStatusCodes.length && (validStatusCodes.indexOf(resp.status) === -1)) {
            throw new Error(util.formatResponseError(resp));
        }

        return resp;
    }


    /**
     * Get Terms of Service URL
     *
     * @returns {Promise<string>} ToS URL
     */

    async getTermsOfServiceUrl() {
        const meta = await this.http.getResourceUrl('meta');

        if (!meta.termsOfService) {
            throw new Error('Unable to locate Terms of Service URL');
        }

        return meta.termsOfService;
    }


    /**
     * Create new account
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-creation
     *
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    async createAccount(data) {
        const resp = await this.apiRequest(data, 'newAccount', [200, 201], false);

        /* Set account URL */
        if (resp.headers.location) {
            this.accountUrl = resp.headers.location;
        }

        return resp;
    }


    /**
     * Update account
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-update
     *
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    updateAccount(data) {
        return this.apiRequest(data, null, [200, 202], true, this.getAccountUrl());
    }


    /**
     * Update account key
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-key-roll-over
     *
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    updateAccountKey(data) {
        return this.apiRequest(data, 'keyChange', [200]);
    }


    /**
     * Create new order
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#applying-for-certificate-issuance
     *
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    createOrder(data) {
        return this.apiRequest(data, 'newOrder', [201]);
    }


    /**
     * Finalize order
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#applying-for-certificate-issuance
     *
     * @param {string} url Finalization URL
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    finalizeOrder(url, data) {
        return this.apiRequest(data, null, [200], true, url);
    }


    /**
     * Get identifier authorization
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#identifier-authorization
     *
     * @param {string} url Authorization URL
     * @returns {Promise<object>} HTTP response
     */

    getAuthorization(url) {
        return this.apiRequest('', null, [200], true, url);
    }


    /**
     * Update identifier authorization
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#deactivating-an-authorization
     *
     * @param {string} url Authorization URL
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    updateAuthorization(url, data) {
        return this.apiRequest(data, null, [200], true, url);
    }


    /**
     * Complete challenge
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#responding-to-challenges
     *
     * @param {string} url Challenge URL
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    completeChallenge(url, data) {
        return this.apiRequest(data, null, [200], true, url);
    }


    /**
     * Revoke certificate
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#certificate-revocation
     *
     * @param {object} data Request payload
     * @returns {Promise<object>} HTTP response
     */

    revokeCert(data) {
        return this.apiRequest(data, 'revokeCert', [200]);
    }
}


/* Export API */
module.exports = AcmeApi;
