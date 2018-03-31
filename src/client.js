/*
 * ACME client
 */

const crypto = require('crypto');
const debug = require('debug')('acme-client');
const HttpClient = require('./http');
const AcmeApi = require('./api');
const openssl = require('./openssl');
const helper = require('./helper');
const easy = require('./easy');


/*
 * Default options
 */

const defaultOpts = {
    directoryUri: undefined,
    accountKey: undefined,
    acceptTermsOfService: false,
    backoffAttempts: 5,
    backoffMin: 5000,
    backoffMax: 30000
};


/**
 * AcmeClient
 *
 * @class
 * @param {object} opts ACME client options
 * @param {string} opts.directoryUri
 * @param {buffer|string} opts.accountKey
 * @param {boolean} [opts.acceptTermsOfService] default: `false`
 * @param {number} [opts.backoffMin] default: `5000`
 * @param {number} [opts.backoffMax] default: `30000`
 * @param {number} [opts.backoffAttempts] default: `5`
 */

class AcmeClient {
    constructor(opts) {
        if (!Buffer.isBuffer(opts.accountKey)) {
            opts.accountKey = Buffer.from(opts.accountKey);
        }

        this.accountUri = null;
        this.opts = Object.assign({}, defaultOpts, opts);

        this.backoffOpts = {
            attempts: this.opts.backoffAttempts,
            min: this.opts.backoffMin,
            max: this.opts.backoffMax
        };

        this.http = new HttpClient(this.opts.directoryUri, this.opts.accountKey);
        this.api = new AcmeApi(this.http);
    }


    /**
     * Terms of Service handler
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#changes-of-terms-of-service
     *
     * @private
     * @param {object} resp HTTP response
     * @param {object} body HTTP body
     * @returns {Promise}
     */

    async tosHandler(resp) {
        debug('Account needs to accept Terms of Service');

        if (this.opts.acceptTermsOfService !== true) {
            debug('this.opts.acceptTermsOfService is not true, returning');
            return null;
        }

        const links = helper.linkParser(resp.headers);
        const tosLink = links['terms-of-service'];

        return this.updateAccount({
            agreement: tosLink
        });
    }


    /**
     * Register new account
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-creation
     *
     * @param {object} [data] Request data
     * @returns {Promise} account
     */

    async registerAccount(data = {}) {
        const resp = await this.api.newReg(data);

        /* Set registration URI */
        if (resp.headers.location) {
            debug('Found account URI from headers');
            this.accountUri = resp.headers.location;
        }

        /* HTTP 409: Account exists */
        if (resp.statusCode === 409) {
            debug('Account already exists (HTTP 409), returning updateAccount()');
            return this.updateAccount(data);
        }

        /* Trigger ToS handler */
        if (helper.tosRequired(data, resp)) {
            return this.tosHandler(resp);
        }

        return resp.body;
    }


    /**
     * Update existing account
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-update
     *
     * @param {object} [data] Request data
     * @returns {Promise} account
     */

    async updateAccount(data = {}) {
        if (!this.accountUri) {
            debug('No account URI found, returning registerAccount()');
            return this.registerAccount(data);
        }

        /* Make request */
        const resp = await this.api.reg(this.accountUri, data);

        /* Trigger ToS handler */
        if (helper.tosRequired(data, resp)) {
            return this.tosHandler(resp);
        }

        return resp.body;
    }


    /**
     * Change account private key
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#account-key-roll-over
     *
     * @param {buffer|string} newAccountKey New PEM encoded private key
     * @param {object} [data] Additional request data
     * @returns {Promise} account
     */

    async changeAccountKey(newAccountKey, data = {}) {
        if (!Buffer.isBuffer(newAccountKey)) {
            newAccountKey = Buffer.from(newAccountKey);
        }

        /* Create new HTTP and API clients using new key */
        const newHttpClient = new HttpClient(this.opts.directoryUri, newAccountKey);
        const newApiClient = new AcmeApi(newHttpClient);

        /* Get new JWK */
        data.account = this.accountUri;
        data.newKey = await newHttpClient.getJwk();

        /* Get signed request body from new client */
        const body = await newHttpClient.createSignedBody(data);

        /* Change key using old client */
        const resp = await this.api.keyChange(body);

        /* Replace existing HTTP and API client */
        this.http = newHttpClient;
        this.api = newApiClient;

        return resp.body;
    }


    /**
     * Register a new domain
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#pre-authorization
     *
     * @param {object} data Request data
     * @returns {Promise} domain
     */

    async registerDomain(data) {
        const resp = await this.api.newAuthz(data);
        return resp.body;
    }


    /**
     * Get key authorization for ACME challenge
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#key-authorizations
     *
     * @param {object} challenge Challenge object returned by API
     * @returns {Promise} keyAuthorization
     */

    async getChallengeKeyAuthorization(challenge) {
        const jwk = await this.http.getJwk();
        const shasum = crypto.createHash('sha256').update(JSON.stringify(jwk));
        const thumbprint = helper.b64escape(shasum.digest('base64'));

        return `${challenge.token}.${thumbprint}`;
    }


    /**
     * Notify provider that challenge has been completed
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#responding-to-challenges
     *
     * @param {object} challenge Challenge object returned by API
     * @returns {Promise} challenge
     */

    async completeChallenge(challenge) {
        const data = {
            keyAuthorization: await this.getChallengeKeyAuthorization(challenge)
        };

        const resp = await this.api.challenge(challenge.uri, data);
        return resp.body;
    }


    /**
     * Verify that ACME challenge is satisfied on base URI
     *
     * @param {string} baseUri Base URI
     * @param {object} challenge Challenge object returned by API
     * @returns {Promise}
     */

    async verifyChallengeBaseUri(baseUri, challenge) {
        const challengeUri = `${baseUri}/.well-known/acme-challenge/${challenge.token}`;
        const keyAuthorization = await this.getChallengeKeyAuthorization(challenge);

        const verifyFn = async () => {
            const resp = await this.http.request(challengeUri, 'GET');

            /* Validate response */
            if (!resp.body || (resp.body !== keyAuthorization)) {
                throw new Error(`Response on URI ${challengeUri} was invalid`);
            }
        };

        debug('Verifying that challenge response is valid', this.backoffOpts);
        return helper.retry(verifyFn, this.backoffOpts);
    }


    /**
     * Wait for ACME provider to verify challenge status
     *
     * @param {object} challenge Challenge object returned by API
     * @returns {Promise} challenge
     */

    async waitForChallengeValidStatus(challenge) {
        const verifyFn = async (abort) => {
            const resp = await this.http.request(challenge.uri, 'GET');

            /* Require HTTP 202 */
            if (resp.statusCode !== 202) {
                throw new Error(resp.body.error || resp.body.detail || resp.body);
            }

            /* Verify status */
            debug(`Challenge returned status: ${resp.body.status}`);

            if (resp.body.status === 'pending') {
                throw new Error('Operation not completed');
            }
            else if (resp.body.status === 'invalid') {
                abort();
                throw new Error(resp.body);
            }
            else if (resp.body.status === 'valid') {
                return resp.body;
            }

            throw new Error('Unexpected challenge status');
        };

        debug('Waiting for challenge status to become valid', this.backoffOpts);
        return helper.retry(verifyFn, this.backoffOpts);
    }


    /**
     * Download single certificate
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#downloading-the-certificate
     *
     * @private
     * @param {string} uri Certificate URI
     * @returns {Promise} certificate
     */

    async downloadCertificate(uri) {
        const resp = await this.http.request(uri, 'GET', { encoding: null });

        /* Require HTTP 200 */
        if (resp.statusCode !== 200) {
            throw new Error(resp.body.error || resp.body.detail || resp.body);
        }

        return openssl.der2pem('x509', resp.body);
    }


    /**
     * Download certificate chain
     *
     * @private
     * @param {object} resp HTTP response
     * @returns {Promise} {certificate, intermediate, chain}
     */

    async downloadCertificateChain(resp) {
        /* Require location header */
        if (!resp.headers.location) {
            throw new Error('Signing the certificate did not return a certificate link');
        }

        /* Download certificate */
        const result = {
            certificate: await this.downloadCertificate(resp.headers.location)
        };

        /* Intermediate certificate */
        const links = helper.linkParser(resp.headers);

        if (links.up) {
            result.intermediate = await this.downloadCertificate(links.up);
        }

        /* Create chain */
        if (result.intermediate && result.certificate) {
            result.chain = Buffer.from(`${result.certificate}${result.intermediate}`);
        }

        return result;
    }


    /**
     * Get chain of certificates
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#downloading-the-certificate
     *
     * @param {buffer|string} csr PEM encoded Certificate Signing Request
     * @param {object} [data] Additional request data
     * @returns {Promise} {certificate, intermediate, chain}
     */

    async getCertificateChain(csr, data = {}) {
        if (!Buffer.isBuffer(csr)) {
            csr = Buffer.from(csr);
        }

        const der = await openssl.pem2der(csr);
        data.csr = helper.b64encode(der);

        const resp = await this.api.newCert(data);
        return this.downloadCertificateChain(resp);
    }


    /**
     * Revoke certificate
     *
     * https://github.com/ietf-wg-acme/acme/blob/master/draft-ietf-acme-acme.md#certificate-revocation
     *
     * @param {buffer|string} cert PEM encoded certificate
     * @param {object} [data] Additional request data
     * @returns {Promise} certificate
     */

    async revokeCertificate(cert, data = {}) {
        const der = await openssl.pem2der(cert);
        data.certificate = helper.b64encode(der);

        const resp = await this.api.revokeCert(data);
        return resp.body;
    }


    /**
     * Easy mode
     *
     * @param {object} opts Options
     * @param {buffer|string} opts.csr Certificate Signing Request
     * @param {function} opts.challengeCreateFn Function to trigger before completing ACME challenge
     * @param {function} opts.challengeRemoveFn Function to trigger after completing ACME challenge
     * @param {string} [opts.email] Account email address
     * @param {string} [opts.challengeType] Wanted ACME challenge type, default: `http-01`
     * @returns {Promise} {certificate, intermediate, chain}
     */

    easy(opts) {
        return easy(this, opts);
    }
}


/* Export client */
module.exports = AcmeClient;
