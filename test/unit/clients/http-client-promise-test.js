const { expect } = require('chai');
const sinon = require('sinon');
const { promisify } = require('util');
const Proxy = require('proxy');
const http = require('http');
const HttpClient = require('@src/clients/http-client-promise');

describe('Http Client Promise test', () => {
    const mockResponse = 'some response';
    const serverOptions = {
        port: 4000,
        host: 'localhost'
    };
    const proxyServerOptions = {
        port: 4001,
        host: 'localhost'
    };
    let server;
    let proxyServer;
    let connectedToProxy;
    beforeEach(async () => {
        connectedToProxy = false;
        server = http.createServer();
        server.on('request', (req, res) => {
            res.end(mockResponse);
        });
        const listenServerAsync = promisify(server.listen.bind(server));
        await listenServerAsync(serverOptions.port);

        proxyServer = Proxy();

        proxyServer.on('connect', () => {
            connectedToProxy = true;
        });
        const listenProxyAsync = promisify(proxyServer.listen.bind(proxyServer));
        await listenProxyAsync(proxyServerOptions.port);
    });

    it('| should make http client', () => {
        const client = new HttpClient({});

        expect(client).instanceOf(HttpClient);
    });

    it('| should make http request', async () => {
        const client = new HttpClient({});

        const options = {
            url: `http://${serverOptions.host}:${serverOptions.port}`,
            method: 'GET'
        };

        const response = await client.invoke(options);

        expect(response.statusCode).eq(200);
        expect(response.body).eq(mockResponse);
        expect(connectedToProxy).eq(false);
    });

    it('| should make http request over proxy', async () => {
        const client = new HttpClient({});
        process.env.ASK_CLI_PROXY = `http://${proxyServerOptions.host}:${proxyServerOptions.port}`;

        const options = {
            url: `http://${serverOptions.host}:${serverOptions.port}`,
            method: 'POST',
            body: 'test'
        };

        const response = await client.invoke(options);

        expect(response.statusCode).eq(200);
        expect(response.body).eq(mockResponse);
        expect(connectedToProxy).eq(true);
    });

    it('| should fail with network error', () => {
        const client = new HttpClient({});

        const options = {
            url: 'http://test-nonexisting',
            method: 'GET'
        };

        return client.invoke(options)
            .catch(err => {
                expect(err).instanceof(Error);
            });
    });

    it('| should fail with http error', () => {
        const isCodeSuccessful = (responseCode) => responseCode > 200; // for testing to simulate http error
        const client = new HttpClient({ isCodeSuccessful });

        const options = {
            url: `http://${serverOptions.host}:${serverOptions.port}`,
            method: 'GET'
        };

        return client.invoke(options)
            .catch(err => {
                expect(err.name).eq('HttpClientResponseError');
                expect(err.message).includes('failed');
            });
    });

    afterEach(() => {
        delete process.env.ASK_CLI_PROXY;
        server.close();
        proxyServer.close();
        sinon.restore();
    });
});
