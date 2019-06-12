/**
 * HTTP client tests
 */

const { assert } = require('chai');
const nock = require('nock');
const HttpClient = require('./../src/http');
const pkg = require('./../package.json');


describe('http', () => {
    let testClient;
    let testClient2;

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


    /**
     * Initialize
     */

    it('should initialize clients', () => {
        testClient = new HttpClient();

        testClient2 = new HttpClient(null, null, {
            headers: {
                'User-Agent': customUserAgent
            }
        });
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
        const resp = await testClient2.request('http://custom-ua.example.com', 'get');
        assert.isObject(resp);
        assert.strictEqual(resp.status, 200);
        assert.strictEqual(resp.data, 'ok');
    });

    it('should not request using default user-agent', async () => {
        await assert.isRejected(testClient2.request('http://default-ua.example.com', 'get'));
    });
});
