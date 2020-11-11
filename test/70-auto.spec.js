/**
 * ACME client.auto tests
 */

const { assert } = require('chai');
const { v4: uuid } = require('uuid');
const cts = require('./challtestsrv');
const acme = require('./../');

const directoryUrl = process.env.ACME_DIRECTORY_URL || acme.directory.letsencrypt.staging;


describe('client.auto', () => {
    let testClient;
    let testCertificate;
    let testSanCertificate;
    let testWildcardCertificate;

    const testDomain = `${uuid()}.example.com`;
    const testHttpDomain = `${uuid()}.example.com`;
    const testDnsDomain = `${uuid()}.example.com`;
    const testWildcardDomain = `${uuid()}.example.com`;

    const testSanDomains = [
        `${uuid()}.example.com`,
        `${uuid()}.example.com`,
        `${uuid()}.example.com`
    ];


    /**
     * Pebble CTS required
     */

    before(function() {
        if (!cts.isEnabled()) {
            this.skip();
        }
    });


    /**
     * Initialize client
     */

    it('should initialize client', async () => {
        const accountKey = await acme.forge.createPrivateKey();

        testClient = new acme.Client({
            directoryUrl,
            accountKey,
            backoffMin: 1000,
            backoffMax: 5000
        });
    });


    /**
     * Invalid challenge response
     */

    it('should throw on invalid challenge response', async () => {
        const [, csr] = await acme.forge.createCsr({
            commonName: `${uuid()}.example.com`
        });

        await assert.isRejected(testClient.auto({
            csr,
            termsOfServiceAgreed: true,
            challengeCreateFn: cts.challengeNoopFn,
            challengeRemoveFn: cts.challengeNoopFn
        }), /^authorization not found/i);
    });

    it('should throw on invalid challenge response with opts.skipChallengeVerification=true', async () => {
        const [, csr] = await acme.forge.createCsr({
            commonName: `${uuid()}.example.com`
        });

        await assert.isRejected(testClient.auto({
            csr,
            termsOfServiceAgreed: true,
            skipChallengeVerification: true,
            challengeCreateFn: cts.challengeNoopFn,
            challengeRemoveFn: cts.challengeNoopFn
        }));
    });


    /**
     * Challenge function exceptions
     */

    it('should throw on challengeCreate exception', async () => {
        const [, csr] = await acme.forge.createCsr({
            commonName: `${uuid()}.example.com`
        });

        await assert.isRejected(testClient.auto({
            csr,
            termsOfServiceAgreed: true,
            challengeCreateFn: cts.challengeThrowFn,
            challengeRemoveFn: cts.challengeNoopFn
        }), /^oops$/);
    });

    it('should not throw on challengeRemove exception', async () => {
        const [, csr] = await acme.forge.createCsr({
            commonName: `${uuid()}.example.com`
        });

        const cert = await testClient.auto({
            csr,
            termsOfServiceAgreed: true,
            challengeCreateFn: cts.challengeCreateFn,
            challengeRemoveFn: cts.challengeThrowFn
        });

        assert.isString(cert);
    });


    /**
     * Order certificates
     */

    it('should order certificate', async () => {
        const [, csr] = await acme.forge.createCsr({
            commonName: testDomain
        });

        const cert = await testClient.auto({
            csr,
            termsOfServiceAgreed: true,
            challengeCreateFn: cts.challengeCreateFn,
            challengeRemoveFn: cts.challengeRemoveFn
        });

        assert.isString(cert);
        testCertificate = cert;
    });

    it('should order certificate using http-01', async () => {
        const [, csr] = await acme.forge.createCsr({
            commonName: testHttpDomain
        });

        const cert = await testClient.auto({
            csr,
            termsOfServiceAgreed: true,
            challengeCreateFn: cts.assertHttpChallengeCreateFn,
            challengeRemoveFn: cts.challengeRemoveFn,
            challengePriority: ['http-01']
        });

        assert.isString(cert);
    });

    it('should order certificate using dns-01', async () => {
        const [, csr] = await acme.forge.createCsr({
            commonName: testDnsDomain
        });

        const cert = await testClient.auto({
            csr,
            termsOfServiceAgreed: true,
            challengeCreateFn: cts.assertDnsChallengeCreateFn,
            challengeRemoveFn: cts.challengeRemoveFn,
            challengePriority: ['dns-01']
        });

        assert.isString(cert);
    });

    it('should order SAN certificate', async () => {
        const [, csr] = await acme.forge.createCsr({
            commonName: testSanDomains[0],
            altNames: testSanDomains
        });

        const cert = await testClient.auto({
            csr,
            termsOfServiceAgreed: true,
            challengeCreateFn: cts.challengeCreateFn,
            challengeRemoveFn: cts.challengeRemoveFn
        });

        assert.isString(cert);
        testSanCertificate = cert;
    });

    it('should order wildcard certificate', async () => {
        const [, csr] = await acme.forge.createCsr({
            commonName: testWildcardDomain,
            altNames: [`*.${testWildcardDomain}`]
        });

        const cert = await testClient.auto({
            csr,
            termsOfServiceAgreed: true,
            challengeCreateFn: cts.challengeCreateFn,
            challengeRemoveFn: cts.challengeRemoveFn
        });

        assert.isString(cert);
        testWildcardCertificate = cert;
    });

    it('should order certificate with opts.skipChallengeVerification=true', async () => {
        const [, csr] = await acme.forge.createCsr({
            commonName: `${uuid()}.example.com`
        });

        const cert = await testClient.auto({
            csr,
            termsOfServiceAgreed: true,
            skipChallengeVerification: true,
            challengeCreateFn: cts.challengeCreateFn,
            challengeRemoveFn: cts.challengeRemoveFn
        });

        assert.isString(cert);
    });


    /**
     * Read certificates
     */

    it('should read certificate info', async () => {
        const info = await acme.forge.readCertificateInfo(testCertificate);

        assert.isObject(info);

        assert.isObject(info.domains);
        assert.isString(info.domains.commonName);
        assert.isArray(info.domains.altNames);
        assert.strictEqual(info.domains.commonName, testDomain);
        assert.deepStrictEqual(info.domains.altNames, [testDomain]);

        assert.strictEqual(Object.prototype.toString.call(info.notBefore), '[object Date]');
        assert.strictEqual(Object.prototype.toString.call(info.notAfter), '[object Date]');
    });

    it('should read SAN certificate info', async () => {
        const info = await acme.forge.readCertificateInfo(testSanCertificate);

        assert.isObject(info);

        assert.isObject(info.domains);
        assert.isString(info.domains.commonName);
        assert.isArray(info.domains.altNames);
        assert.strictEqual(info.domains.commonName, testSanDomains[0]);
        assert.deepStrictEqual(info.domains.altNames, testSanDomains);

        assert.strictEqual(Object.prototype.toString.call(info.notBefore), '[object Date]');
        assert.strictEqual(Object.prototype.toString.call(info.notAfter), '[object Date]');
    });

    it('should read wildcard certificate info', async () => {
        const info = await acme.forge.readCertificateInfo(testWildcardCertificate);

        assert.isObject(info);

        assert.isObject(info.domains);
        assert.isString(info.domains.commonName);
        assert.isArray(info.domains.altNames);
        assert.strictEqual(info.domains.commonName, testWildcardDomain);
        assert.deepStrictEqual(info.domains.altNames, [testWildcardDomain, `*.${testWildcardDomain}`]);

        assert.strictEqual(Object.prototype.toString.call(info.notBefore), '[object Date]');
        assert.strictEqual(Object.prototype.toString.call(info.notAfter), '[object Date]');
    });
});
