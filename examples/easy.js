/*
 * Example of acme.Client.easy
 */

var fs = require('fs');
var acme = require('./../');


function stdout(m) {
    process.stdout.write(m + '\n');
}

function stderr(m) {
    process.stderr.write(m + '\n');
}


/**
 * Function used to satisfy an ACME challenge
 *
 * @param {string} keyAuthorization String containing the challenge response
 * @param {object} challenge The challenge object returned from the ACME API
 * @param {string} domain The domain name for the current challenge
 * @param {function} callback `{string}` err, `{object}` verify
 */

function challengeCreate(keyAuthorization, challenge, domain, callback) {
    var fileName = '/var/www/html/.well-known/acme-challenge/' + challenge.token;
    var fileContents = keyAuthorization;

    fs.writeFile(fileName, fileContents, function(err) {
        if (err) return callback(err);


        /**
         * Calling back without `verify` triggers no challenge verification
         * before updating status with ACME provider.
         *
         * When calling back with `verify.http` acme-client will ensure that
         * the challenge is satisfied (HTTP) before notifying the ACME provider.
         *
         * When calling back with `verify.https` acme-client will ensure that
         * the challenge is satisfied (HTTPS) before notifying the ACME provider.
         */

        callback(null, {
            http: 'http://' + domain
            // https: 'https://' + domain
        });
    });
}


/**
 * Function used to remove an ACME challenge response
 *
 * @param {object} challenge The challenge object returned from the ACME API
 * @param {string} domain The domain name for the current challenge
 * @param {function} callback `{string}` err
 */
function challengeRemove(challenge, domain, callback) {
    var fileName = '/var/www/html/.well-known/acme-challenge/' + challenge.token;

    /* Remove the challenge response */
    fs.unlink(fileName, callback);
}


/*
 * Config
 */

var accountPrivateKey = '<PEM encoded private key>';
var accountEmail = 'test@example.com';

var client = new acme.Client({
    directoryUri: acme.directory.letsencrypt.staging,
    accountKey: accountPrivateKey,
    acceptTermsOfService: true
});

var csrConfig = {
    commonName: 'example.com',
    altNames: ['test.example.com', 'something.example.com'],
    country: 'GB'
    // etc...
};


/*
 * Create Certificate Signing Request
 */

acme.openssl.createCsr(csrConfig, function(csrErr, csrResult) {
    if (csrErr) return stderr(csrErr);

    var csr = csrResult.csr;                    // Certificate Signing Request
    var key = csrResult.key;                    // Certificate private key

    /* Easy config */
    var easyConfig = {
        csr: csr,                               // PEM encoded CSR
        email: accountEmail,                    // Account email address
        challengeCreateFn: challengeCreate,     // Function to call before validation
        challengeRemoveFn: challengeRemove,     // Function to call after validation
        challengeType: 'http-01'                // Wanted challenge type (default: http-01)
    };

    /* Get certificates */
    client.easy(easyConfig, function(certErr, result) {
        if (certErr) return stderr(certErr);

        var certificate = result.certificate;
        var intermediate = result.intermediate;
        var chain = result.chain;

        stdout('=== CSR ===');
        stdout(csr.toString());
        stdout();

        stdout('=== PRIVATE KEY ===');
        stdout(key.toString());
        stdout();

        stdout('=== CERTIFICATE ===');
        stdout(certificate.toString());
        stdout();

        stdout('=== INTERMEDIATE CERTIFICATE ===');
        stdout(intermediate.toString());
        stdout();

        stdout('=== CHAIN CERTIFICATE ===');
        stdout(chain.toString());
        stdout();
    });
});
