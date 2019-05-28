/**
 * Axios Wrapper Test.
 */

const axios = require('axios');
const assert = require('chai').assert;
const nock = require('nock');
const axiosWrapper = require('../src/axiosWrapper');


describe('axiosWrapper', () => {
    it('should send a User-Agent header by default', async () => {
        nock('http://www.example.com', {
            reqheaders: {
                'User-Agent': /^node-.*$/
            }
        })
            .get('/')
            .reply(200, 'success');
        const response = await axiosWrapper.getInstance().get('http://www.example.com/');
        assert.equal(response.status, 200);
    });

    it('should allow swapping out the axios instance', async () => {
        nock('http://www.example.com', {
            reqheaders: {
                'User-Agent': /^custom$/
            }
        })
            .get('/')
            .reply(200, 'success');

        const instance = axios.create();
        instance.defaults.headers.common['User-Agent'] = 'custom';
        axiosWrapper.setInstance(instance);

        const response = await axiosWrapper.getInstance().get('http://www.example.com/');
        assert.equal(response.status, 200);
    });
});
