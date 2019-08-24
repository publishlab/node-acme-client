/**
 * Setup testing
 */

const url = require('url');
const net = require('net');
const Promise = require('bluebird');
const dns = Promise.promisifyAll(require('dns'));
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const axios = require('./../src/axios');


/**
 * Add promise support to Chai
 */

chai.use(chaiAsPromised);


/**
 * Custom DNS resolver
 */

if (process.env.ACME_DNS_RESOLVER) {
    dns.setServers([process.env.ACME_DNS_RESOLVER]);


    /**
     * Axios DNS resolver
     */

    axios.interceptors.request.use(async (config) => {
        const urlObj = url.parse(config.url);

        /* Bypass */
        if (axios.defaults.bypassCustomDnsResolver === true) {
            return config;
        }

        /* Skip IP addresses and localhost */
        if (net.isIP(urlObj.hostname) || (urlObj.hostname === 'localhost')) {
            return config;
        }

        /* Lookup hostname */
        const result = await dns.resolve4Async(urlObj.hostname);

        if (!result.length) {
            throw new Error(`Unable to lookup address: ${urlObj.hostname}`);
        }

        /* Place hostname in header */
        config.headers = config.headers || {};
        config.headers.Host = urlObj.hostname;

        /* Inject address into URL */
        delete urlObj.host;
        urlObj.hostname = result[0];
        config.url = url.format(urlObj);

        /* Done */
        return config;
    });
}
