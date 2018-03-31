/**
 * AcmeApi
 *
 * @class
 * @param {HttpClient} httpClient
 */

class AcmeApi {
    constructor(httpClient) {
        this.http = httpClient;
    }


    /**
     * ACME API HTTP request
     *
     * @private
     * @param {object} data Request payload
     * @param {string} method HTTP method
     * @param {array} [validStatusCodes] Array of valid HTTP response status codes
     * @param {string} [uri] HTTP request URI
     * @returns {Promise} Response
     */

    async apiRequest(data, method, validStatusCodes = [], uri = null) {
        if (!uri) {
            uri = await this.http.getResourceUri(data.resource);
        }

        const resp = await this.http.signedRequest(uri, method, data);

        if (validStatusCodes.length && (validStatusCodes.indexOf(resp.statusCode) === -1)) {
            throw new Error(resp.body.error || resp.body.detail || resp.body);
        }

        return resp;
    }


    /**
     * new-reg
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-creation
     *
     * @param {object} data Request payload
     * @returns {Promise} Response
     */

    newReg(data) {
        data.resource = 'new-reg';
        return this.apiRequest(data, 'POST', [201, 409]);
    }


    /**
     * reg
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-update
     *
     * @param {string} uri Registration URI
     * @param {object} data Request payload
     * @returns {Promise} Response
     */

    reg(uri, data) {
        data.resource = 'reg';
        return this.apiRequest(data, 'POST', [200, 202], uri);
    }


    /**
     * key-change
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-key-roll-over
     *
     * @param {object} data Request payload
     * @returns {Promise} Response
     */

    keyChange(data) {
        data.resource = 'key-change';
        return this.apiRequest(data, 'POST', [200]);
    }


    /**
     * new-authz
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#pre-authorization
     *
     * @param {object} data Request payload
     * @returns {Promise} Response
     */

    newAuthz(data) {
        data.resource = 'new-authz';
        return this.apiRequest(data, 'POST', [201]);
    }


    /**
     * authz
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#identifier-authorization
     *
     * @param {object} data Request payload
     * @returns {Promise} Response
     */

    authz(data) {
        data.resource = 'authz';
        return this.apiRequest(data, 'POST', [200]);
    }


    /**
     * new-cert
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#applying-for-certificate-issuance
     *
     * @param {object} data Request payload
     * @returns {Promise} Response
     */

    newCert(data) {
        data.resource = 'new-cert';
        return this.apiRequest(data, 'POST', [201]);
    }


    /**
     * revoke-cert
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#certificate-revocation
     *
     * @param {object} data Request payload
     * @returns {Promise} Response
     */

    revokeCert(data) {
        data.resource = 'revoke-cert';
        return this.apiRequest(data, 'POST', [200]);
    }


    /**
     * challenge
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#responding-to-challenges
     *
     * @param {string} uri Challenge URI
     * @param {object} data Request payload
     * @returns {Promise} Response
     */

    challenge(uri, data) {
        data.resource = 'challenge';
        return this.apiRequest(data, 'POST', [202], uri);
    }
}


/* Export API */
module.exports = AcmeApi;
