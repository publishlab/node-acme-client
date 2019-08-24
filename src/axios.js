/**
 * Axios instance
 */

const axios = require('axios');
const pkg = require('./../package.json');


/**
 * Instance
 */

const instance = axios.create();

/* Default User-Agent */
instance.defaults.headers.common['User-Agent'] = `node-${pkg.name}/${pkg.version}`;

/* Default ACME settings */
instance.defaults.acmeSettings = {
    httpChallengePort: 80,
    bypassCustomDnsResolver: false
};


/**
 * Export instance
 */

module.exports = instance;
