/*
 * ACME tests
 */

const assert = require('chai').assert;
const acme = require('./../');


describe('client', () => {
    let testPrivateKey;
    let testSecondaryPrivateKey;
    let testClient;
    let testSecondaryClient;
    let testAccount;
    let testChallenge;

    const testContact = 'mailto:test@example.com';
    const testDomain = 'example.com';
    const testChallengeType = 'http-01';


    /*
     * Fixtures
     */

    it('should generate a private key', async () => {
        testPrivateKey = await acme.openssl.createPrivateKey();
        assert.strictEqual(Buffer.isBuffer(testPrivateKey), true);
    });

    it('should create a second private key', async () => {
        testSecondaryPrivateKey = await acme.openssl.createPrivateKey(2048);
        assert.strictEqual(Buffer.isBuffer(testSecondaryPrivateKey), true);
    });


    /*
     * Initialize clients
     */

    it('should initialize client', () => {
        testClient = new acme.Client({
            directoryUri: acme.directory.letsencrypt.staging,
            accountKey: testPrivateKey,
            acceptTermsOfService: true
        });
    });

    it('should initialize secondary account', () => {
        testSecondaryClient = new acme.Client({
            directoryUri: acme.directory.letsencrypt.staging,
            accountKey: testPrivateKey,
            acceptTermsOfService: true
        });
    });


    /*
     * Verify JWK
     */

    it('should produce a valid JWK', async () => {
        const jwk = await testClient.http.getJwk();
        assert.isObject(jwk);
        assert.strictEqual(jwk.e, 'AQAB');
        assert.strictEqual(jwk.kty, 'RSA');
    });


    /*
     * Register account
     */

    it('should register an account', async () => {
        testAccount = await testClient.registerAccount();
        assert.isObject(testAccount);
        assert.strictEqual(testAccount.status, 'valid');
    });


    /*
     * Find existing account
     */

    it('should find existing account', async () => {
        const account = await testSecondaryClient.registerAccount();
        assert.isObject(account);
        assert.strictEqual(account.status, 'valid');
        assert.strictEqual(testAccount.id, account.id);
    });


    /*
     * Update account contact info
     */

    it('should update account contact info', async () => {
        const data = { contact: [testContact] };
        const account = await testClient.updateAccount(data);

        assert.isObject(account);
        assert.include(account.contact, testContact);
    });


    /*
     * Change account private key
     */

    it('should change account private key', async () => {
        const account = await testClient.changeAccountKey(testSecondaryPrivateKey);
        assert.isObject(account);
        assert.strictEqual(account.status, 'valid');
    });


    /*
     * Register domain and find challenge
     */

    it('should register a domain', async () => {
        const data = {
            identifier: {
                type: 'dns',
                value: testDomain
            }
        };

        const domain = await testClient.registerDomain(data);
        assert.isObject(domain);
        assert.strictEqual(domain.status, 'pending');
        assert.isArray(domain.challenges);

        testChallenge = domain.challenges.filter(c => c.type === testChallengeType).pop();

        assert.isObject(testChallenge);
        assert.strictEqual(testChallenge.status, 'pending');
    });


    /*
     * Generate challenge key authorization
     */

    it('should get a challenge key authorization', async () => {
        const keyAuth = await testClient.getChallengeKeyAuthorization(testChallenge);
        assert.isString(keyAuth);
    });


    /*
     * Deactivate account
     */

    it('should deactivate the test account', async () => {
        const data = { status: 'deactivated' };
        const account = await testClient.updateAccount(data);

        assert.isObject(account);
        assert.strictEqual(account.status, 'deactivated');
    });


    /*
     * Verify that no new authorizations can be made
     */

    it('should not allow new domain registration', async () => {
        const data = {
            identifier: {
                type: 'dns',
                value: 'nope.com'
            }
        };

        await assert.isRejected(testClient.registerDomain(data));
    });
});
