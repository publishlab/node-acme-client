/*
 * OpenSSL helper tests
 */

var fs = require('fs');
var path = require('path');
var async = require('async');
var assert = require('chai').assert;
var openssl = require('./../').openssl;


describe('openssl', function() {
    var testPemKey;
    var testDerKey;
    var testPublicPemKey;
    var testPublicDerKey;
    var testCsr;
    var testSanCsr;
    var testCert;

    var testCsrDomain = 'example.com';
    var testSanCsrDomains = ['example.com', 'test.example.com', 'abc.example.com'];
    var testCertPath = path.join(__dirname, 'fixtures', 'certificate.crt');


    /*
     * Fixtures
     */

    it('should read certificate fixture', function(done) {
        fs.readFile(testCertPath, function(err, file) {
            assert.isNull(err);
            assert.strictEqual(Buffer.isBuffer(file), true);

            testCert = file;
            done();
        });
    });

    it('should generate a private key', function(done) {
        openssl.createPrivateKey(function(err, key) {
            assert.isNull(err);
            assert.strictEqual(Buffer.isBuffer(key), true);

            testPemKey = key;
            done();
        });
    });

    it('should generate a private key with size=1024', function(done) {
        openssl.createPrivateKey(1024, function(err, key) {
            assert.isNull(err);
            assert.strictEqual(Buffer.isBuffer(key), true);

            done();
        });
    });

    it('should generate a public key', function(done) {
        openssl.createPublicKey(testPemKey, function(err, key) {
            assert.isNull(err);
            assert.strictEqual(Buffer.isBuffer(key), true);

            testPublicPemKey = key;
            done();
        });
    });


    /*
     * Encoding
     */

    it('should convert private key pem -> der', function(done) {
        openssl.pem2der(testPemKey, function(err, der) {
            assert.isNull(err);
            assert.strictEqual(Buffer.isBuffer(der), true);

            testDerKey = der;
            done();
        });
    });

    it('should convert public key pem -> der', function(done) {
        openssl.pem2der(testPublicPemKey, function(err, der) {
            assert.isNull(err);
            assert.strictEqual(Buffer.isBuffer(der), true);

            testPublicDerKey = der;
            done();
        });
    });

    it('should convert private key der -> pem', function(done) {
        openssl.der2pem('rsa', testDerKey, function(err, pem) {
            assert.isNull(err);
            assert.strictEqual(Buffer.isBuffer(pem), true);
            assert.strictEqual(testPemKey.toString(), pem.toString());

            done();
        });
    });

    it('should convert public key der -> pem', function(done) {
        openssl.der2pem('rsa', testPublicDerKey, true, function(err, pem) {
            assert.isNull(err);
            assert.strictEqual(Buffer.isBuffer(pem), true);
            assert.strictEqual(testPublicPemKey.toString(), pem.toString());

            done();
        });
    });


    /*
     * Certificate Signing Requests
     */

    it('should generate a CSR', function(done) {
        openssl.createCsr({
            commonName: testCsrDomain
        }, function(err, data) {
            assert.isNull(err);
            assert.strictEqual(Buffer.isBuffer(data.key), true);
            assert.strictEqual(Buffer.isBuffer(data.csr), true);

            testCsr = data.csr;
            done();
        });
    });

    it('should generate a SAN CSR', function(done) {
        openssl.createCsr({
            commonName: testSanCsrDomains.shift(),
            altNames: testSanCsrDomains
        }, function(err, data) {
            assert.isNull(err);
            assert.strictEqual(Buffer.isBuffer(data.key), true);
            assert.strictEqual(Buffer.isBuffer(data.csr), true);

            testSanCsr = data.csr;
            done();
        });
    });

    it('should resolve domains from CSR', function(done) {
        openssl.readCsrDomains(testCsr, function(err, domains) {
            assert.isNull(err);
            assert.isArray(domains);
            assert.include(domains, testCsrDomain);

            done();
        });
    });

    it('should resolve domains from SAN CSR', function(done) {
        openssl.readCsrDomains(testSanCsr, function(err, domains) {
            assert.isNull(err);
            assert.isArray(domains);

            testSanCsrDomains.forEach(function(domain) {
                assert.include(domains, domain);
            });

            done();
        });
    });


    /*
     * Certificates
     */

    it('should read info from certificate', function(done) {
        openssl.readCertificateInfo(testCert, function(err, info) {
            assert.isNull(err);
            assert.isObject(info);
            assert.isArray(info.domains);
            assert.include(info.domains, 'example.com');
            assert.strictEqual(Object.prototype.toString.call(info.notBefore), '[object Date]');
            assert.strictEqual(Object.prototype.toString.call(info.notAfter), '[object Date]');

            done();
        });
    });


    /*
     * Modulus
     */

    it('should get modulus', function(done) {
        async.each([testPemKey, testPublicPemKey, testCsr, testSanCsr, testCert], function(item, callback) {
            openssl.getModulus(item, function(err, modulus) {
                assert.isNull(err);
                assert.strictEqual(Buffer.isBuffer(modulus), true);

                callback();
            });
        }, done);
    });


    /*
     * Public exponent
     */

    it('should get public exponent', function(done) {
        async.each([testPemKey, testPublicPemKey, testCsr, testSanCsr, testCert], function(item, callback) {
            openssl.getPublicExponent(item, function(err, exponent) {
                assert.isNull(err);
                assert.strictEqual(Buffer.isBuffer(exponent), true);
                assert.strictEqual(exponent.toString('base64'), 'AQAB');

                callback();
            });
        }, done);
    });
});
