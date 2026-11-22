/**
 * Signed request retries: a retried ACME request must be signed again with a
 * fresh nonce, never replayed, because nonces are single use.
 */

const { randomUUID: uuid, generateKeyPairSync } = require('crypto');
const { assert } = require('chai');
const nock = require('nock');
const axios = require('./../src/axios');
const HttpClient = require('./../src/http');

describe('http signed request retries', () => {
    const endpoint = `http://${uuid()}.example.com`;
    const accountKey = generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({ type: 'pkcs8', format: 'pem' });

    let nonceCounter = 0;
    let client;
    let originalSettings;

    const nonceOf = (body) => {
        const jws = (typeof body === 'string') ? JSON.parse(body) : body;
        return JSON.parse(Buffer.from(jws.protected, 'base64url').toString()).nonce;
    };

    beforeEach(() => {
        originalSettings = { ...axios.defaults.acmeSettings };
        axios.defaults.acmeSettings.retryDefaultDelay = 0;

        nock(endpoint).persist().get('/directory').reply(200, {
            newNonce: `${endpoint}/new-nonce`,
            newOrder: `${endpoint}/new-order`,
        });
        nock(endpoint).persist().head('/new-nonce').reply(() => {
            nonceCounter += 1;
            return [200, '', { 'Replay-Nonce': `nonce-${nonceCounter}` }];
        });

        client = new HttpClient(`${endpoint}/directory`, accountKey);
    });

    afterEach(() => {
        nock.cleanAll();
        axios.defaults.acmeSettings = originalSettings;
    });

    it('should sign a rate limited request again with a fresh nonce', async () => {
        const nonces = [];

        nock(endpoint).post('/new-order').reply((uri, body) => {
            nonces.push(nonceOf(body));
            return [429, { type: 'urn:ietf:params:acme:error:rateLimited' }, { 'Retry-After': '1' }];
        });
        nock(endpoint).post('/new-order').reply((uri, body) => {
            nonces.push(nonceOf(body));
            return [201, { status: 'pending' }];
        });

        const resp = await client.signedRequest(`${endpoint}/new-order`, { identifiers: [] }, { kid: `${endpoint}/acct/1` });

        assert.strictEqual(resp.status, 201);
        assert.lengthOf(nonces, 2);
        assert.notStrictEqual(nonces[0], nonces[1], 'the retry reused a spent nonce');
    });

    it('should sign a request again after a server error', async () => {
        const nonces = [];

        nock(endpoint).post('/new-order').reply((uri, body) => {
            nonces.push(nonceOf(body));
            return [503, 'unavailable'];
        });
        nock(endpoint).post('/new-order').reply((uri, body) => {
            nonces.push(nonceOf(body));
            return [201, { status: 'pending' }];
        });

        const resp = await client.signedRequest(`${endpoint}/new-order`, { identifiers: [] }, { kid: `${endpoint}/acct/1` });

        assert.strictEqual(resp.status, 201);
        assert.notStrictEqual(nonces[0], nonces[1]);
    });

    it('should hand a rate limit above retryMaxDelay back without retrying', async () => {
        let calls = 0;
        axios.defaults.acmeSettings.retryMaxDelay = 60;

        nock(endpoint).persist().post('/new-order').reply(() => {
            calls += 1;
            return [429, { type: 'urn:ietf:params:acme:error:rateLimited' }, { 'Retry-After': '3600' }];
        });

        const resp = await client.signedRequest(`${endpoint}/new-order`, { identifiers: [] }, { kid: `${endpoint}/acct/1` });

        assert.strictEqual(resp.status, 429);
        assert.strictEqual(calls, 1);
    });

    it('should stop after retryMaxAttempts and return the last response', async () => {
        let calls = 0;
        axios.defaults.acmeSettings.retryMaxAttempts = 2;

        nock(endpoint).persist().post('/new-order').reply(() => {
            calls += 1;
            return [503, 'unavailable'];
        });

        const resp = await client.signedRequest(`${endpoint}/new-order`, { identifiers: [] }, { kid: `${endpoint}/acct/1` });

        assert.strictEqual(resp.status, 503);
        assert.strictEqual(calls, 3);
    });

    it('should sign a request again after a transport failure', async () => {
        const nonces = [];

        nock(endpoint).post('/new-order').replyWithError({ code: 'ECONNRESET', message: 'socket hang up' });
        nock(endpoint).post('/new-order').reply((uri, body) => {
            nonces.push(nonceOf(body));
            return [201, { status: 'pending' }];
        });

        const before = nonceCounter;
        const resp = await client.signedRequest(`${endpoint}/new-order`, { identifiers: [] }, { kid: `${endpoint}/acct/1` });

        assert.strictEqual(resp.status, 201);
        assert.strictEqual(nonceCounter - before, 2, 'the retry did not fetch a fresh nonce');
        assert.strictEqual(nonces[0], `nonce-${nonceCounter}`);
    });

    it('should leave unsigned requests to the http layer retries', async () => {
        let calls = 0;

        nock(endpoint).persist().get('/plain').reply(() => {
            calls += 1;
            return (calls < 2) ? [429, 'slow down', { 'Retry-After': '1' }] : [200, 'ok'];
        });

        const resp = await client.request(`${endpoint}/plain`, 'get');

        assert.strictEqual(resp.status, 200);
        assert.strictEqual(calls, 2);
    });
});
