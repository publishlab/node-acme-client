/**
 * ACME client tests
 */

const { assert } = require('chai');
const { v4: uuid } = require('uuid');
const Promise = require('bluebird');
const cts = require('./challtestsrv');
const spec = require('./spec');
const acme = require('./../');

const directoryUrl = process.env.ACME_DIRECTORY_URL || acme.directory.letsencrypt.staging;
const capMetaTosField = !(('ACME_CAP_META_TOS_FIELD' in process.env) && (process.env.ACME_CAP_META_TOS_FIELD === '0'));
const capUpdateAccountKey = !(('ACME_CAP_UPDATE_ACCOUNT_KEY' in process.env) && (process.env.ACME_CAP_UPDATE_ACCOUNT_KEY === '0'));


describe('client', () => {
    let testPrivateKey;
    let testSecondaryPrivateKey;
    let testClient;
    let testAccount;
    let testAccountUrl;
    let testOrder;
    let testOrderWildcard;
    let testAuthz;
    let testAuthzWildcard;
    let testChallenge;
    let testChallengeWildcard;
    let testKeyAuthorization;
    let testKeyAuthorizationWildcard;
    let testCsr;
    let testCsrWildcard;
    let testCertificate;
    let testCertificateWildcard;

    const testDomain = `${uuid()}.example.com`;
    const testDomainWildcard = `*.${testDomain}`;
    const testContact = `mailto:test-${uuid()}@nope.com`;


    /**
     * Pebble CTS required
     */

    before(function() {
        if (!cts.isEnabled()) {
            this.skip();
        }
    });


    /**
     * Fixtures
     */

    it('should generate a private key', async () => {
        testPrivateKey = await acme.forge.createPrivateKey();
        assert.isTrue(Buffer.isBuffer(testPrivateKey));
    });

    it('should create a second private key', async () => {
        testSecondaryPrivateKey = await acme.forge.createPrivateKey(2048);
        assert.isTrue(Buffer.isBuffer(testSecondaryPrivateKey));
    });

    it('should generate certificate signing request', async () => {
        [, testCsr] = await acme.forge.createCsr({ commonName: testDomain });
        [, testCsrWildcard] = await acme.forge.createCsr({ commonName: testDomainWildcard });
    });


    /**
     * Initialize clients
     */

    it('should initialize client', () => {
        testClient = new acme.Client({
            directoryUrl,
            accountKey: testPrivateKey
        });
    });

    it('should produce a valid JWK', async () => {
        const jwk = await testClient.http.getJwk();

        assert.isObject(jwk);
        assert.strictEqual(jwk.e, 'AQAB');
        assert.strictEqual(jwk.kty, 'RSA');
    });


    /**
     * Terms of Service
     */

    it('should produce Terms of Service URL [ACME_CAP_META_TOS_FIELD]', async function() {
        if (!capMetaTosField) {
            this.skip();
        }

        const tos = await testClient.getTermsOfServiceUrl();
        assert.isString(tos);
    });

    it('should not produce Terms of Service URL [!ACME_CAP_META_TOS_FIELD]', async function() {
        if (capMetaTosField) {
            this.skip();
        }

        const tos = await testClient.getTermsOfServiceUrl();
        assert.isNull(tos);
    });


    /**
     * Create account
     */

    it('should refuse account creation without ToS [ACME_CAP_META_TOS_FIELD]', async function() {
        if (!capMetaTosField) {
            this.skip();
        }

        await assert.isRejected(testClient.createAccount());
    });

    it('should create an account', async () => {
        testAccount = await testClient.createAccount({
            termsOfServiceAgreed: true
        });

        spec.rfc8555.account(testAccount);
        assert.strictEqual(testAccount.status, 'valid');
    });

    it('should produce an account URL', () => {
        testAccountUrl = testClient.getAccountUrl();
        assert.isString(testAccountUrl);
    });


    /**
     * Find existing account using secondary client
     */

    it('should throw when trying to find account using invalid account key', async () => {
        const client = new acme.Client({
            directoryUrl,
            accountKey: testSecondaryPrivateKey
        });

        await assert.isRejected(client.createAccount({
            onlyReturnExisting: true
        }));
    });

    it('should find existing account using account key', async () => {
        const client = new acme.Client({
            directoryUrl,
            accountKey: testPrivateKey
        });

        const account = await client.createAccount({
            onlyReturnExisting: true
        });

        spec.rfc8555.account(account);
        assert.strictEqual(account.status, 'valid');
        assert.deepStrictEqual(account.key, testAccount.key);
    });


    /**
     * Account URL
     */

    it('should refuse invalid account URL', async () => {
        const client = new acme.Client({
            directoryUrl,
            accountKey: testPrivateKey,
            accountUrl: 'https://acme-staging-v02.api.letsencrypt.org/acme/acct/1'
        });

        await assert.isRejected(client.updateAccount());
    });

    it('should find existing account using account URL', async () => {
        const client = new acme.Client({
            directoryUrl,
            accountKey: testPrivateKey,
            accountUrl: testAccountUrl
        });

        const account = await client.createAccount({
            onlyReturnExisting: true
        });

        spec.rfc8555.account(account);
        assert.strictEqual(account.status, 'valid');
        assert.deepStrictEqual(account.key, testAccount.key);
    });


    /**
     * Update account contact info
     */

    it('should update account contact info', async () => {
        const data = { contact: [testContact] };
        const account = await testClient.updateAccount(data);

        spec.rfc8555.account(account);
        assert.strictEqual(account.status, 'valid');
        assert.deepStrictEqual(account.key, testAccount.key);
        assert.isArray(account.contact);
        assert.include(account.contact, testContact);
    });


    /**
     * Change account private key
     */

    it('should change account private key [ACME_CAP_UPDATE_ACCOUNT_KEY]', async function() {
        if (!capUpdateAccountKey) {
            this.skip();
        }

        await testClient.updateAccountKey(testSecondaryPrivateKey);

        const account = await testClient.createAccount({
            onlyReturnExisting: true
        });

        spec.rfc8555.account(account);
        assert.strictEqual(account.status, 'valid');
        assert.notDeepEqual(account.key, testAccount.key);
    });


    /**
     * Create new certificate order
     */

    it('should create new order', async () => {
        const data1 = { identifiers: [{ type: 'dns', value: testDomain }] };
        const data2 = { identifiers: [{ type: 'dns', value: testDomainWildcard }] };

        testOrder = await testClient.createOrder(data1);
        testOrderWildcard = await testClient.createOrder(data2);

        [testOrder, testOrderWildcard].forEach((item) => {
            spec.rfc8555.order(item);
            assert.strictEqual(item.status, 'pending');
        });
    });


    /**
     * Get status of existing certificate order
     */

    it('should get existing order', async () => {
        await Promise.map([testOrder, testOrderWildcard], async (existing) => {
            const result = await testClient.getOrder(existing);

            spec.rfc8555.order(result);
            assert.deepStrictEqual(existing, result);
        });
    });


    /**
     * Get identifier authorization
     */

    it('should get identifier authorization', async () => {
        const orderAuthzCollection = await testClient.getAuthorizations(testOrder);
        const wildcardAuthzCollection = await testClient.getAuthorizations(testOrderWildcard);

        [orderAuthzCollection, wildcardAuthzCollection].forEach((collection) => {
            assert.isArray(collection);
            assert.isNotEmpty(collection);

            collection.forEach((authz) => {
                spec.rfc8555.authorization(authz);
                assert.strictEqual(authz.status, 'pending');
            });
        });

        testAuthz = orderAuthzCollection.pop();
        testAuthzWildcard = wildcardAuthzCollection.pop();

        testAuthz.challenges.concat(testAuthzWildcard.challenges).forEach((item) => {
            spec.rfc8555.challenge(item);
            assert.strictEqual(item.status, 'pending');
        });
    });


    /**
     * Generate challenge key authorization
     */

    it('should get challenge key authorization', async () => {
        testChallenge = testAuthz.challenges.find((c) => (c.type === 'http-01'));
        testChallengeWildcard = testAuthzWildcard.challenges.find((c) => (c.type === 'dns-01'));

        testKeyAuthorization = await testClient.getChallengeKeyAuthorization(testChallenge);
        testKeyAuthorizationWildcard = await testClient.getChallengeKeyAuthorization(testChallengeWildcard);

        [testKeyAuthorization, testKeyAuthorizationWildcard].forEach((k) => assert.isString(k));
    });


    /**
     * Deactivate identifier authorization
     */

    it('should deactivate identifier authorization', async () => {
        const order = await testClient.createOrder({
            identifiers: [
                { type: 'dns', value: `${uuid()}.example.com` },
                { type: 'dns', value: `${uuid()}.example.com` }
            ]
        });

        const authzCollection = await testClient.getAuthorizations(order);

        const results = await Promise.map(authzCollection, async (authz) => {
            spec.rfc8555.authorization(authz);
            assert.strictEqual(authz.status, 'pending');
            return testClient.deactivateAuthorization(authz);
        });

        results.forEach((authz) => {
            spec.rfc8555.authorization(authz);
            assert.strictEqual(authz.status, 'deactivated');
        });
    });


    /**
     * Verify satisfied challenge
     */

    it('should verify challenge', async () => {
        await cts.assertHttpChallengeCreateFn(testAuthz, testChallenge, testKeyAuthorization);
        await cts.assertDnsChallengeCreateFn(testAuthzWildcard, testChallengeWildcard, testKeyAuthorizationWildcard);

        await testClient.verifyChallenge(testAuthz, testChallenge);
        await testClient.verifyChallenge(testAuthzWildcard, testChallengeWildcard);
    });


    /**
     * Complete challenge
     */

    it('should complete challenge', async () => {
        await Promise.map([testChallenge, testChallengeWildcard], async (challenge) => {
            const result = await testClient.completeChallenge(challenge);

            spec.rfc8555.challenge(result);
            assert.strictEqual(challenge.url, result.url);
        });
    });


    /**
     * Wait for valid challenge
     */

    it('should wait for valid challenge status', async () => {
        await Promise.map([testChallenge, testChallengeWildcard], async (c) => testClient.waitForValidStatus(c));
    });


    /**
     * Finalize order
     */

    it('should finalize order', async () => {
        const finalize = await testClient.finalizeOrder(testOrder, testCsr);
        const finalizeWildcard = await testClient.finalizeOrder(testOrderWildcard, testCsrWildcard);

        [finalize, finalizeWildcard].forEach((f) => spec.rfc8555.order(f));

        assert.strictEqual(testOrder.url, finalize.url);
        assert.strictEqual(testOrderWildcard.url, finalizeWildcard.url);
    });


    /**
     * Wait for valid order
     */

    it('should wait for valid order status', async () => {
        await Promise.map([testOrder, testOrderWildcard], async (o) => testClient.waitForValidStatus(o));
    });


    /**
     * Get certificate
     */

    it('should get certificate', async () => {
        testCertificate = await testClient.getCertificate(testOrder);
        testCertificateWildcard = await testClient.getCertificate(testOrderWildcard);

        await Promise.map([testCertificate, testCertificateWildcard], async (cert) => {
            assert.isString(cert);
            return acme.forge.readCertificateInfo(cert);
        });
    });


    /**
     * Revoke certificate
     */

    it('should revoke certificate', async () => {
        await testClient.revokeCertificate(testCertificate);
        await testClient.revokeCertificate(testCertificateWildcard, { reason: 4 });
    });

    it('should not allow getting revoked certificate', async () => {
        await assert.isRejected(testClient.getCertificate(testOrder));
        await assert.isRejected(testClient.getCertificate(testOrderWildcard));
    });


    /**
     * Deactivate account
     */

    it('should deactivate account', async () => {
        const data = { status: 'deactivated' };
        const account = await testClient.updateAccount(data);

        spec.rfc8555.account(account);
        assert.strictEqual(account.status, 'deactivated');
    });


    /**
     * Verify that no new orders can be made
     */

    it('should not allow new orders from deactivated account', async () => {
        const data = {
            identifiers: [{ type: 'dns', value: 'nope.com' }]
        };

        await assert.isRejected(testClient.createOrder(data));
    });
});
