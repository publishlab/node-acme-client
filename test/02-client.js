/*
 * ACME tests
 */

var assert = require('chai').assert;
var acme = require('./../');


describe('client', function() {
    var testPrivateKey;
    var testSecondaryPrivateKey;
    var testClient;
    var testSecondaryClient;
    var testAccount;
    var testChallenge;

    var testContact = 'mailto:test@example.com';
    var testDomain = 'example.com';
    var testChallengeType = 'http-01';


    /*
     * Fixtures
     */

    it('should generate a private key', function(done) {
        acme.openssl.createPrivateKey(function(err, privateKey) {
            assert.isNull(err);
            assert.strictEqual(Buffer.isBuffer(privateKey), true);

            testPrivateKey = privateKey;
            done();
        });
    });

    it('should create a second private key', function(done) {
        acme.openssl.createPrivateKey(2048, function(err, privateKey) {
            assert.isNull(err);
            assert.strictEqual(Buffer.isBuffer(privateKey), true);

            testSecondaryPrivateKey = privateKey;
            done();
        });
    });


    /*
     * Initialize client
     */

    it('should initialize client', function(done) {
        testClient = new acme.Client({
            directoryUri: acme.directory.letsencrypt.staging,
            accountKey: testPrivateKey,
            acceptTermsOfService: true
        });

        done();
    });


    /*
     * Verify JWK
     */

    it('should produce a valid JWK', function(done) {
        testClient.http.getJwk(function(err, jwk) {
            assert.isNull(err);
            assert.isObject(jwk);
            assert.strictEqual(jwk.e, 'AQAB');
            assert.strictEqual(jwk.kty, 'RSA');

            done();
        });
    });


    /*
     * Register account
     */

    it('should register an account', function(done) {
        testClient.registerAccount(function(err, account) {
            assert.isNull(err);
            assert.isObject(account);
            assert.strictEqual(account.status, 'valid');

            testAccount = account;
            done();
        });
    });


    /*
     * Initialize second client
     */

    it('should initialize secondary client', function(done) {
        testSecondaryClient = new acme.Client({
            directoryUri: acme.directory.letsencrypt.staging,
            accountKey: testPrivateKey,
            acceptTermsOfService: true
        });

        done();
    });


    /*
     * Find existing account and match
     */

    it('should find existing account', function(done) {
        testSecondaryClient.registerAccount(function(err, account) {
            assert.isNull(err);
            assert.isObject(account);
            assert.strictEqual(account.status, 'valid');
            assert.strictEqual(testAccount.id, account.id);

            done();
        });
    });


    /*
     * Update account contact info
     */

    it('should update account contact info', function(done) {
        var data = { contact: [testContact] };

        testClient.updateAccount(data, function(err, account) {
            assert.isNull(err);
            assert.isObject(account);
            assert.include(account.contact, testContact);

            done();
        });
    });


    /*
     * Change account private key
     */

    it('should change account private key', function(done) {
        testClient.changeAccountKey(testSecondaryPrivateKey, function(err, account) {
            assert.isNull(err);
            assert.isObject(account);
            assert.strictEqual(account.status, 'valid');

            done();
        });
    });


    /*
     * Register domain and find challenge
     */

    it('should register a domain', function(done) {
        var data = {
            identifier: {
                type: 'dns',
                value: testDomain
            }
        };

        testClient.registerDomain(data, function(err, domain) {
            assert.isNull(err);
            assert.isObject(domain);
            assert.strictEqual(domain.status, 'pending');

            var challenge = domain.challenges.filter(function(c) {
                return (c.type === testChallengeType);
            }).pop();

            assert.isObject(challenge);
            assert.strictEqual(challenge.status, 'pending');

            testChallenge = challenge;
            done();
        });
    });


    /*
     * Generate challenge key authorization
     */

    it('should get a challenge key authorization', function(done) {
        testClient.getChallengeKeyAuthorization(testChallenge, function(err, keyAuthorization) {
            assert.isNull(err);
            assert.isString(keyAuthorization);

            done();
        });
    });


    /*
     * Deactivate account
     */

    it('should deactivate the test account', function(done) {
        var data = { status: 'deactivated' };

        testClient.updateAccount(data, function(err, account) {
            assert.isNull(err);
            assert.isObject(account);
            assert.strictEqual(account.status, 'deactivated');

            done();
        });
    });


    /*
     * Verify that no new authorizations can be made
     */

    it('should not allow new domain registration', function(done) {
        var data = {
            identifier: {
                type: 'dns',
                value: 'nope.com'
            }
        };

        testClient.registerDomain(data, function(err, domain) {
            assert.isNotNull(err);
            assert.isUndefined(domain);

            done();
        });
    });
});
