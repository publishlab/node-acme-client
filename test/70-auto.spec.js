/**
 * ACME client.auto tests
 */

const { assert } = require('chai');
const { v4: uuid } = require('uuid');
const Promise = require('bluebird');
const cts = require('./challtestsrv');
const getCertIssuers = require('./get-cert-issuers');
const spec = require('./spec');
const acme = require('./../');

const domainName = process.env.ACME_DOMAIN_NAME || 'example.com';
const directoryUrl = process.env.ACME_DIRECTORY_URL || acme.directory.letsencrypt.staging;
const capAlternateCertRoots = !(('ACME_CAP_ALTERNATE_CERT_ROOTS' in process.env) && (process.env.ACME_CAP_ALTERNATE_CERT_ROOTS === '0'));


describe('client.auto', () => {
    let testIssuers;
    let testClient;
    let testCertificate;
    let testSanCertificate;
    let testWildcardCertificate;

    const testDomain = `${uuid()}.${domainName}`;
    const testHttpDomain = `${uuid()}.${domainName}`;
    const testDnsDomain = `${uuid()}.${domainName}`;
    const testWildcardDomain = `${uuid()}.${domainName}`;

    const testSanDomains = [
        `${uuid()}.${domainName}`,
        `${uuid()}.${domainName}`,
        `${uuid()}.${domainName}`
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
     * Fixtures
     */

    it('should resolve certificate issuers [ACME_CAP_ALTERNATE_CERT_ROOTS]', async function() {
        if (!capAlternateCertRoots) {
            this.skip();
        }

        testIssuers = await getCertIssuers();

        assert.isArray(testIssuers);
        assert.isTrue(testIssuers.length > 1);

        testIssuers.forEach((i) => {
            assert.isString(i);
            assert.strictEqual(1, testIssuers.filter((c) => (c === i)).length);
        });
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
            commonName: `${uuid()}.${domainName}`
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
            commonName: `${uuid()}.${domainName}`
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
            commonName: `${uuid()}.${domainName}`
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
            commonName: `${uuid()}.${domainName}`
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
            commonName: `${uuid()}.${domainName}`
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

    it('should order alternate certificate chain [ACME_CAP_ALTERNATE_CERT_ROOTS]', async function() {
        if (!capAlternateCertRoots) {
            this.skip();
        }

        await Promise.map(testIssuers, async (issuer) => {
            const [, csr] = await acme.forge.createCsr({
                commonName: `${uuid()}.${domainName}`
            });

            const cert = await testClient.auto({
                csr,
                termsOfServiceAgreed: true,
                preferredChain: issuer,
                challengeCreateFn: cts.challengeCreateFn,
                challengeRemoveFn: cts.challengeRemoveFn
            });

            const rootCert = acme.forge.splitPemChain(cert).pop();
            const info = await acme.forge.readCertificateInfo(rootCert);

            assert.strictEqual(issuer, info.issuer.commonName);
        });
    });

    it('should get default chain with invalid preference [ACME_CAP_ALTERNATE_CERT_ROOTS]', async function() {
        if (!capAlternateCertRoots) {
            this.skip();
        }

        const [, csr] = await acme.forge.createCsr({
            commonName: `${uuid()}.${domainName}`
        });

        const cert = await testClient.auto({
            csr,
            termsOfServiceAgreed: true,
            preferredChain: uuid(),
            challengeCreateFn: cts.challengeCreateFn,
            challengeRemoveFn: cts.challengeRemoveFn
        });

        const rootCert = acme.forge.splitPemChain(cert).pop();
        const info = await acme.forge.readCertificateInfo(rootCert);

        assert.strictEqual(testIssuers[0], info.issuer.commonName);
    });


    /**
     * Read certificates
     */

    it('should read certificate info', async () => {
        const info = await acme.forge.readCertificateInfo(testCertificate);

        spec.crypto.certificateInfo(info);
        assert.strictEqual(info.domains.commonName, testDomain);
        assert.deepStrictEqual(info.domains.altNames, [testDomain]);
    });

    it('should read SAN certificate info', async () => {
        const info = await acme.forge.readCertificateInfo(testSanCertificate);

        spec.crypto.certificateInfo(info);
        assert.strictEqual(info.domains.commonName, testSanDomains[0]);
        assert.deepStrictEqual(info.domains.altNames, testSanDomains);
    });

    it('should read wildcard certificate info', async () => {
        const info = await acme.forge.readCertificateInfo(testWildcardCertificate);

        spec.crypto.certificateInfo(info);
        assert.strictEqual(info.domains.commonName, testWildcardDomain);
        assert.deepStrictEqual(info.domains.altNames, [testWildcardDomain, `*.${testWildcardDomain}`]);
    });
});
