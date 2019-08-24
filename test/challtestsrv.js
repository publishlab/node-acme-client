/**
 * Pebble Challenge Test Server integration
 */

const axios = require('./../src/axios');

const apiBaseUrl = process.env.ACME_CHALLTESTSRV_URL || null;


/**
 * Send request
 */

async function request(apiPath, data = {}) {
    if (!apiBaseUrl) {
        throw new Error('No Pebble Challenge Test Server URL found');
    }

    await axios.request({
        url: `${apiBaseUrl}/${apiPath}`,
        method: 'post',
        data
    });

    return true;
}


/**
 * State
 */

exports.isEnabled = () => !!apiBaseUrl;


/**
 * DNS
 */

exports.addDnsARecord = async (host, addresses) => request('add-a', { host, addresses });
exports.setDnsCnameRecord = async (host, target) => request('set-cname', { host, target });


/**
 * Challenges
 */

exports.addHttp01ChallengeResponse = async (token, content) => request('add-http01', { token, content });
exports.addDns01ChallengeResponse = async (host, value) => request('set-txt', { host, value });
