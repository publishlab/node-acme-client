/**
 * Axios instance
 */

const axios = require('axios');
const pkg = require('./../package.json');


/**
 * Instance
 */

const instance = axios.create();
instance.defaults.headers.common['User-Agent'] = `node-${pkg.name}/${pkg.version}`;

module.exports = instance;
