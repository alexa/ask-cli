const { expect } = require('chai');
const jsonView = require('@src/view/json-view');

describe('View test - JSON view test', () => {
    describe('# Test function toString', () => {
        it('| convert object to JSON string', () => {
            // setup
            const TEST_OBJ = {
                key: 'value'
            };
            const TEST_OBJ_JSON_STRING = '{\n  "key": "value"\n}';
            // call
            const jsonDisplay = jsonView.toString(TEST_OBJ);
            // verify
            expect(jsonDisplay).equal(TEST_OBJ_JSON_STRING);
        });

        it('| display error when JSON stringify throws error', () => {
            // setup
            const TEST_CIRCULAR_OBJ = {};
            TEST_CIRCULAR_OBJ.key = { key2: TEST_CIRCULAR_OBJ };
            // call
            const jsonDisplay = jsonView.toString(TEST_CIRCULAR_OBJ);
            // verify
            expect(jsonDisplay.startsWith('TypeError: Converting circular structure to JSON')).equal(true);
        });
    });
});
