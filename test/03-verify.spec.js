/*
 * Challenge verification tests
 */

const assert = require('chai').assert;
const nock = require('nock');
const verify = require('./../src/verify');


describe('verify', () => {
    const challengeTypes = ['http-01', 'dns-01'];

    const fixtures = {
        http: {
            authz: { identifier: { type: 'dns', value: 'example.com' } },
            challenge: { type: 'http-01', status: 'pending', token: 'test' },
            key: 'test'
        },
        dns: {
            authz: { identifier: { type: 'dns', value: 'example.com' } },
            challenge: { type: 'dns-01', status: 'pending', token: 'test' },
            key: 'v=spf1 -all'
        }
    };


    /*
     * HTTP mocking
     */

    before(() => {
        nock(`http://${fixtures.http.authz.identifier.value}`)
            .get(`/.well-known/acme-challenge/${fixtures.http.challenge.token}`)
            .reply(200, fixtures.http.challenge.token);
    });


    /*
     * API
     */

    it('should expose verification API', async () => {
        assert.containsAllKeys(verify, challengeTypes);
    });


    /*
     * http-01
     */

    it('should verify http-01 challenge', async () => {
        const resp = await verify['http-01'](fixtures.http.authz, fixtures.http.challenge, fixtures.http.key);
        assert.strictEqual(resp, true);
    });

    it('should reject http-01 challenge', async () => {
        await assert.isRejected(verify['http-01'](fixtures.http.authz, fixtures.http.challenge, 'err'));
    });


    /*
     * dns-01
     */

    it('should verify dns-01 challenge', async () => {
        const resp = await verify['dns-01'](fixtures.dns.authz, fixtures.dns.challenge, fixtures.dns.key, '');
        assert.strictEqual(resp, true);
    });

    it('should reject dns-01 challenge', async () => {
        await assert.isRejected(verify['dns-01'](fixtures.dns.authz, fixtures.dns.challenge, 'err'));
    });
});
