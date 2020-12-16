const { expect } = require('chai');
const sinon = require('sinon');
const { services } = require('ask-smapi-model');
const HttpClient = require('@src/clients/http-client-promise');
const { makeSmapiClient } = require('@src/clients/ask-smapi-client');

describe('Ask Smapi client test', () => {
    const accessToken = 'token';
    const debug = false;
    const mockResponse = { _links: {
        next: {
            href: '/v0/catalogs?nextToken=AYADeGqbzq'
        },
        self: {
            href: '/v0/catalogs'
        }
    },
    catalogs: [] };
    beforeEach(() => {
        sinon.stub(HttpClient.prototype, 'invoke').resolves(
            { headers: { 'content-type': 'application/json',
                'x-amz-rid': '9HRE9RWZ88K6BJZPXP6K',
                'x-amzn-requestid': '50b3ae21-ab0a-42ca-9095-dab5a18fde41',
                test: ['foo', 'bar'] },
            statusCode: 200,
            body: JSON.stringify(mockResponse) }
        );
    });

    it('| should make smapi client', () => {
        const client = makeSmapiClient({ accessToken, debug });

        expect(client).instanceOf(services.skillManagement.SkillManagementServiceClient);
    });

    it('| should call smapi client method', async () => {
        const client = makeSmapiClient({ accessToken, debug });

        const result = await client.listCatalogsForVendorV0('test');

        expect(result).eql(mockResponse);
    });

    afterEach(() => {
        sinon.restore();
    });
});
