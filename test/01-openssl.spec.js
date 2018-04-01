/*
 * OpenSSL helper tests
 */

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const assert = require('chai').assert;
const openssl = require('./../src').openssl;


describe('openssl', () => {
    let testPemKey;
    let testDerKey;
    let testPublicPemKey;
    let testPublicDerKey;
    let testCsr;
    let testSanCsr;
    let testCert;
    let testSanCert;

    const testCsrDomain = 'example.com';
    const testSanCsrDomains = ['example.com', 'test.example.com', 'abc.example.com'];
    const testCertPath = path.join(__dirname, 'fixtures', 'certificate.crt');
    const testSanCertPath = path.join(__dirname, 'fixtures', 'san-certificate.crt');


    /*
     * Fixtures
     */

    it('should read certificate fixture', async () => {
        testCert = await fs.readFileAsync(testCertPath);
        assert.strictEqual(Buffer.isBuffer(testCert), true);
    });

    it('should read SAN certificate fixture', async () => {
        testSanCert = await fs.readFileAsync(testSanCertPath);
        assert.strictEqual(Buffer.isBuffer(testSanCert), true);
    });

    it('should generate a private key', async () => {
        testPemKey = await openssl.createPrivateKey();
        assert.strictEqual(Buffer.isBuffer(testPemKey), true);
    });

    it('should generate a private key with size=1024', async () => {
        const key = await openssl.createPrivateKey(1024);
        assert.strictEqual(Buffer.isBuffer(key), true);
    });

    it('should generate a public key', async () => {
        testPublicPemKey = await openssl.createPublicKey(testPemKey);
        assert.strictEqual(Buffer.isBuffer(testPublicPemKey), true);
    });


    /*
     * Encoding
     */

    it('should convert private key pem -> der', async () => {
        testDerKey = await openssl.pem2der(testPemKey);
        assert.strictEqual(Buffer.isBuffer(testDerKey), true);
    });

    it('should convert public key pem -> der', async () => {
        testPublicDerKey = await openssl.pem2der(testPublicPemKey);
        assert.strictEqual(Buffer.isBuffer(testPublicDerKey), true);
    });

    it('should convert private key der -> pem', async () => {
        const pem = await openssl.der2pem('rsa', testDerKey);
        assert.strictEqual(Buffer.isBuffer(pem), true);
        assert.strictEqual(testPemKey.toString(), pem.toString());
    });

    it('should convert public key der -> pem', async () => {
        const pem = await openssl.der2pem('rsa', testPublicDerKey, true);
        assert.strictEqual(Buffer.isBuffer(pem), true);
        assert.strictEqual(testPublicPemKey.toString(), pem.toString());
    });


    /*
     * Certificate Signing Requests
     */

    it('should generate a CSR', async () => {
        const result = await openssl.createCsr({
            commonName: testCsrDomain
        });

        assert.strictEqual(Buffer.isBuffer(result.key), true);
        assert.strictEqual(Buffer.isBuffer(result.csr), true);

        testCsr = result.csr;
    });

    it('should generate a SAN CSR', async () => {
        const result = await openssl.createCsr({
            commonName: testSanCsrDomains[0],
            altNames: testSanCsrDomains.slice(1, testSanCsrDomains.length)
        });

        assert.strictEqual(Buffer.isBuffer(result.key), true);
        assert.strictEqual(Buffer.isBuffer(result.csr), true);

        testSanCsr = result.csr;
    });

    it('should resolve domains from CSR', async () => {
        const domains = await openssl.readCsrDomains(testCsr);

        assert.isObject(domains);
        assert.isString(domains.commonName);
        assert.isArray(domains.altNames);
        assert.strictEqual(domains.commonName, testCsrDomain);
        assert.strictEqual(domains.altNames.length, 0);
    });

    it('should resolve domains from SAN CSR', async () => {
        const domains = await openssl.readCsrDomains(testSanCsr);

        assert.isObject(domains);
        assert.isString(domains.commonName);
        assert.isArray(domains.altNames);
        assert.strictEqual(domains.commonName, testSanCsrDomains[0]);
        assert.deepEqual(domains.altNames, testSanCsrDomains.slice(1, testSanCsrDomains.length));
    });


    /*
     * Certificates
     */

    it('should read info from certificate', async () => {
        const info = await openssl.readCertificateInfo(testCert);

        assert.isObject(info);

        assert.isObject(info.domains);
        assert.isString(info.domains.commonName);
        assert.isArray(info.domains.altNames);
        assert.strictEqual(info.domains.commonName, testCsrDomain);
        assert.strictEqual(info.domains.altNames.length, 0);

        assert.strictEqual(Object.prototype.toString.call(info.notBefore), '[object Date]');
        assert.strictEqual(Object.prototype.toString.call(info.notAfter), '[object Date]');
    });

    it('should read info from SAN certificate', async () => {
        const info = await openssl.readCertificateInfo(testSanCert);

        assert.isObject(info);

        assert.isObject(info.domains);
        assert.isString(info.domains.commonName);
        assert.isArray(info.domains.altNames);
        assert.strictEqual(info.domains.commonName, testSanCsrDomains[0]);
        assert.deepEqual(info.domains.altNames, testSanCsrDomains.slice(1, testSanCsrDomains.length));

        assert.strictEqual(Object.prototype.toString.call(info.notBefore), '[object Date]');
        assert.strictEqual(Object.prototype.toString.call(info.notAfter), '[object Date]');
    });


    /*
     * Modulus
     */

    it('should get modulus', async () => {
        await Promise.all([testPemKey, testPublicPemKey, testCsr, testSanCsr, testCert].map(async (item) => {
            const modulus = await openssl.getModulus(item);
            assert.strictEqual(Buffer.isBuffer(modulus), true);
        }));
    });


    /*
     * Public exponent
     */

    it('should get public exponent', async () => {
        await Promise.all([testPemKey, testPublicPemKey, testCsr, testSanCsr, testCert].map(async (item) => {
            const exponent = await openssl.getPublicExponent(item);
            assert.strictEqual(Buffer.isBuffer(exponent), true);
            assert.strictEqual(exponent.toString('base64'), 'AQAB');
        }));
    });
});
