/**
 * ACME client.auto tests
 */

const { assert } = require('chai');
const uuid = require('uuid/v4');
const cts = require('./challtestsrv');
const acme = require('./../');

const directoryUrl = process.env.ACME_DIRECTORY_URL || acme.directory.letsencrypt.staging;


describe('client.auto', () => {
    let testClient;
    let testCertificate;
    let testSanCertificate;
    let testWildcardCertificate;

    const testDomain = `${uuid()}.example.com`;
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
     * Mock challenge response with Pebble CTS
     */

    async function challengeCreateFn(authz, challenge, keyAuthorization) {
        if (challenge.type === 'http-01') {
            return cts.addHttp01ChallengeResponse(challenge.token, keyAuthorization);
        }

        if (challenge.type === 'dns-01') {
            return cts.addDns01ChallengeResponse(`_acme-challenge.${authz.identifier.value}.`, keyAuthorization);
        }

        throw new Error(`Unsupported challenge type ${challenge.type}`);
    }

    async function challengeRemoveFn() {
        return true;
    }


    /**
     * Initialize client
     */

    it('should initialize client', async () => {
        const accountKey = await acme.forge.createPrivateKey();
        testClient = new acme.Client({ directoryUrl, accountKey });
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
            challengeCreateFn,
            challengeRemoveFn
        });

        assert.isString(cert);
        testCertificate = cert;
    });

    it('should order SAN certificate', async () => {
        const [, csr] = await acme.forge.createCsr({
            commonName: testSanDomains[0],
            altNames: testSanDomains
        });

        const cert = await testClient.auto({
            csr,
            termsOfServiceAgreed: true,
            challengeCreateFn,
            challengeRemoveFn
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
            challengeCreateFn,
            challengeRemoveFn
        });

        assert.isString(cert);
        testWildcardCertificate = cert;
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
