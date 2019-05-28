/**
 * Axios Wrapper to allow plugging a custom instance.
 */

const axios = require('axios');
const os = require('os');
const pkg = require('./../package.json');

const userAgentString = `node-${pkg.name}/${pkg.version} (${os.type()} ${os.release()})`;

let instance = axios.create();
instance.defaults.headers.common['User-Agent'] = userAgentString;

exports.getInstance = function() {
    return instance;
};

exports.setInstance = function(newInstance) {
    instance = newInstance;
};
