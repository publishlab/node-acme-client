/*
 * Example of acme.Client.easy
 */

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const acme = require('./../');


function stdout(m) {
    process.stdout.write(`${m}\n`);
}

function stderr(m) {
    process.stderr.write(`${m}\n`);
}


/**
 * Function used to satisfy an ACME challenge
 *
 * @param {string} keyAuthorization String containing the challenge response
 * @param {object} challenge The challenge object returned from the ACME API
 * @param {string} domain The domain name for the current challenge
 * @returns {Promise} verify
 */

async function challengeCreateFn(keyAuthorization, challenge, domain) {
    const fileName = `/var/www/html/.well-known/acme-challenge/${challenge.token}`;
    const fileContents = keyAuthorization;

    stdout(`Creating challenge for ${domain} on path: ${fileName}`);
    await fs.writeFileAsync(fileName, fileContents);


    /**
     * Returning nothing triggers no challenge verification before updating
     * status with the ACME provider.
     *
     * Returning `http` will ensure that the challenge is satisfied (HTTP)
     * before notifying the ACME provider.
     *
     * Returning `https` will ensure that the challenge is satisfied (HTTPS)
     * before notifying the ACME provider.
     */

    return {
        http: `http://${domain}`
        // https: `https://${domain}`
    };
}


/**
 * Function used to remove an ACME challenge response
 *
 * @param {object} challenge The challenge object returned from the ACME API
 * @param {string} domain The domain name for the current challenge
 * @returns {Promise}
 */

function challengeRemoveFn(challenge, domain) {
    const fileName = `/var/www/html/.well-known/acme-challenge/${challenge.token}`;

    stdout(`Removing challenge for ${domain} from path: ${fileName}`);
    return fs.unlinkAsync(fileName);
}


/*
 * Config
 */

const privateKey = '<PEM encoded private key>';
const email = 'test@example.com';

const client = new acme.Client({
    directoryUri: acme.directory.letsencrypt.staging,
    accountKey: privateKey,
    acceptTermsOfService: true
});

const csrConfig = {
    commonName: 'example.com',
    altNames: ['test.example.com', 'something.example.com'],
    country: 'GB'
    // etc...
};


/*
 * Create certificate
 */

async function createCertificate() {
    const { csr, key } = await acme.openssl.createCsr(csrConfig);

    /* Easy config */
    const easyConfig = {
        csr,
        email,
        challengeCreateFn,
        challengeRemoveFn,
        challengeType: 'http-01'
    };

    /* Get certificates */
    const { certificate, intermediate, chain } = await client.easy(easyConfig);

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
}

try {
    createCertificate();
}
catch (e) {
    stderr(`Error: ${e.message}`);
}
