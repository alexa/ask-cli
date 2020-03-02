const { expect } = require('chai');
const mapTestersEmails = require('@src/commands/smapi/customizations/hook-functions/map-testers-emails');


describe('Smapi hook functions test - mapTestersEmails tests', () => {
    it('| should map testers emails to TestersRequest parameter', () => {
        const requestParameters = { testersEmails: ['tester1', 'tester2'] };

        mapTestersEmails(requestParameters);

        const expected = { testers: [{ emailId: 'tester1' }, { emailId: 'tester2' }] };

        expect(requestParameters.TestersRequest).eql(expected);
    });
});
