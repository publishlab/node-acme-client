/**
 * Axios instance
 */

const axios = require('axios');
const { parseRetryAfterHeader } = require('./util');
const { log } = require('./logger');
const pkg = require('./../package.json');

const { AxiosError } = axios;

/**
 * Defaults
 */

const instance = axios.create();

// Default User-Agent
instance.defaults.headers.common['User-Agent'] = `node-${pkg.name}/${pkg.version}`;

// Default ACME settings
instance.defaults.acmeSettings = {
    httpChallengePort: 80,
    httpsChallengePort: 443,
    tlsAlpnChallengePort: 443,

    retryMaxAttempts: 5,
    retryDefaultDelay: 5,
    retryMaxDelay: null,
};

/**
 * Explicitly set Node as default HTTP adapter
 *
 * https://github.com/axios/axios/issues/1180
 * https://stackoverflow.com/questions/42677387
 */

instance.defaults.adapter = 'http';

/**
 * Retry requests on server errors or when rate limited
 *
 * https://datatracker.ietf.org/doc/html/rfc8555#section-6.6
 */

function isRetryableError(error) {
    return (error.code !== 'ECONNABORTED')
        && (error.code !== 'ERR_NOCK_NO_MATCH')
        && (!error.response
            || (error.response.status === 429)
            || ((error.response.status >= 500) && (error.response.status <= 599)));
}

// https://github.com/axios/axios/blob/main/lib/core/settle.js
function validateStatus(response) {
    const validator = response.config.retryValidateStatus;

    if (!response.status || !validator || validator(response.status)) {
        return response;
    }

    throw new AxiosError(
        `Request failed with status code ${response.status}`,
        (Math.floor(response.status / 100) === 4) ? AxiosError.ERR_BAD_REQUEST : AxiosError.ERR_BAD_RESPONSE,
        response.config,
        response.request,
        response,
    );
}

// Pass all responses through the error interceptor
instance.interceptors.request.use((config) => {
    if (!('retryValidateStatus' in config)) {
        config.retryValidateStatus = config.validateStatus;
    }

    config.validateStatus = () => false;
    return config;
});

// Handle request retries if applicable
instance.interceptors.response.use(null, async (error) => {
    const { config, response } = error;

    if (!config) {
        return Promise.reject(error);
    }

    // Pick up errors we want to retry
    if (isRetryableError(error)) {
        const { retryMaxAttempts, retryDefaultDelay, retryMaxDelay } = instance.defaults.acmeSettings;
        config.retryAttempt = ('retryAttempt' in config) ? (config.retryAttempt + 1) : 1;

        if (config.retryAttempt <= retryMaxAttempts) {
            const code = response ? `HTTP ${response.status}` : error.code;
            log(`Caught ${code}, retry attempt ${config.retryAttempt}/${retryMaxAttempts} to URL ${config.url}`);

            // Attempt to parse Retry-After header, fallback to default delay
            let retryAfter = response ? parseRetryAfterHeader(response.headers['retry-after']) : 0;

            if (retryAfter > 0) {
                log(`Found retry-after response header with value: ${response.headers['retry-after']}, waiting ${retryAfter} seconds`);

                /* Hand long rate limits back to the caller instead of sleeping on them.
                   A provider may ask us to wait hours or days, which is a decision for
                   the caller to make, not something to sit out inside a request. */
                if ((retryMaxDelay !== null) && (retryAfter > retryMaxDelay)) {
                    log(`Retry-after of ${retryAfter} seconds exceeds retryMaxDelay of ${retryMaxDelay}, not retrying`);
                    return validateStatus(response);
                }
            }
            else {
                retryAfter = (retryDefaultDelay * config.retryAttempt);
                log(`Unable to locate or parse retry-after response header, waiting ${retryAfter} seconds`);
            }

            // Wait and retry the request
            await new Promise((resolve) => { setTimeout(resolve, (retryAfter * 1000)); });
            return instance(config);
        }
    }

    /* Transport level failure, there is no response to validate. Reject with the
       original error rather than tripping over an undefined response below. */
    if (!response) {
        return Promise.reject(error);
    }

    // Validate and return response
    return validateStatus(response);
});

/**
 * Export instance
 */

module.exports = instance;
