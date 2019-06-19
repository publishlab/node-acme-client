/**
 * HTTP client tests
 */

const { assert } = require('chai');
const nock = require('nock');
const axios = require('./../src/axios');
const HttpClient = require('./../src/http');
const pkg = require('./../package.json');


describe('http', () => {
    let testClient;

    const defaultUserAgent = `node-${pkg.name}/${pkg.version}`;
    const customUserAgent = 'custom-ua-123';


    /**
     * HTTP mocking
     */

    before(() => {
        nock('http://www.example.com')
            .persist()
            .get('/')
            .reply(200, 'ok');

        const defaultUaOpts = {
            reqheaders: {
                'User-Agent': defaultUserAgent
            }
        };

        const customUaOpts = {
            reqheaders: {
                'User-Agent': customUserAgent
            }
        };

        nock('http://default-ua.example.com', defaultUaOpts)
            .persist()
            .get('/')
            .reply(200, 'ok');

        nock('http://custom-ua.example.com', customUaOpts)
            .persist()
            .get('/')
            .reply(200, 'ok');
    });

    after(() => {
        axios.defaults.headers.common['User-Agent'] = defaultUserAgent;
    });


    /**
     * Initialize
     */

    it('should initialize clients', () => {
        testClient = new HttpClient();
    });


    /**
     * HTTP verbs
     */

    it('should http get', async () => {
        const resp = await testClient.request('http://www.example.com', 'get');
        assert.isObject(resp);
        assert.strictEqual(resp.status, 200);
        assert.strictEqual(resp.data, 'ok');
    });


    /**
     * User-Agent
     */

    it('should request using default user-agent', async () => {
        const resp = await testClient.request('http://default-ua.example.com', 'get');

        assert.isObject(resp);
        assert.strictEqual(resp.status, 200);
        assert.strictEqual(resp.data, 'ok');
    });

    it('should not request using custom user-agent', async () => {
        await assert.isRejected(testClient.request('http://custom-ua.example.com', 'get'));
    });

    it('should request using custom user-agent', async () => {
        axios.defaults.headers.common['User-Agent'] = customUserAgent;
        const resp = await testClient.request('http://custom-ua.example.com', 'get');

        assert.isObject(resp);
        assert.strictEqual(resp.status, 200);
        assert.strictEqual(resp.data, 'ok');
    });

    it('should not request using default user-agent', async () => {
        axios.defaults.headers.common['User-Agent'] = customUserAgent;
        await assert.isRejected(testClient.request('http://default-ua.example.com', 'get'));
    });
});
