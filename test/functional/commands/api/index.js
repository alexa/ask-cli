const sinon = require('sinon');
const R = require('ramda');
const os = require('os');
const fs = require('fs');
const path = require('path');

const AuthorizationController = require('@src/controllers/authorization-controller');
const Messenger = require('@src/view/messenger');
const { commander } = require('@src/commands/api/api-commander');
const httpClient = require('@src/clients/http-client');
const CONSTANTS = require('@src/utils/constants');
const metricClient = require('@src/utils/metrics');

/**
 *  Provide static profile and token related Test data
 *  for tester to use.
 */
const testDataProvider = {
    VALID_PROFILE: 'TEST_VALID_PROFILE',
    INVALID_PROFILE: 'TEST_INVALID_PROFILE',
    VALID_TOKEN: {
        DEFAULT_PROFILE_TOKEN: 'DEFAULT_TOKEN',
        VALID_PROFILE_TOKEN: 'VALID_PROFILE_TOKEN',
        ENV_PROFILE_TOKEN: 'ENV_PROFILE_TOKEN'
    },
    VALID_VENDOR_ID: {
        DEFAULT_VENDOR_ID: 'DEFAULT_VENDOR_ID',
        VALID_VENDOR_ID: 'VALID_VENDOR_ID',
        ENV_VENDOR_ID: 'ENV_VENDOR_ID'
    }
};

/**
 * ApiCommandBasicTest provide developer with interface to write functional test for api commands
 *
 * @param {string} operation            the name of command
 *
 * @param {string} cmd                  the command line input users typed to console
 *
 * @param {object} envVar               Used to temporarily change process.env
 *                                      Since there's no way to mock process.env,
 *                                      have to modify the real process.env during
 *                                      each test and set it back after test finished
 *
 * @param {object} httpMockConfig       Should follow the pattern:
 *                                      [{
*                                           input: [requestOptions, operation]
*                                           output: [error, response]
 *                                      }]
 *                                      Developer can use this param to decide the
 *                                      behaviour of httpClient function. It's a array
 *                                      because for some test case, user need rely on
 *                                      multiple http calls
 *
 * @param {function} expectationHandler Let user use expect function to write assertions
 *                                      This function will take one param: stdCacher,
 *                                      which will record all console log and
 *                                      console error during the process.
 */

class ApiCommandBasicTest {
    constructor({ operation, cmd, envVar, httpMockConfig, expectationHandler }) {
        try {
            this.operation = operation;
            this.cmd = cmd;
            this.envVar = envVar;
            this.httpMockConfig = httpMockConfig;
            this.expectationHandler = expectationHandler;
            // Record original commander keys
            // Since the commander object is not stateless,
            // need to record its original status and
            // set back each time after commander.parse
            this.apiCommandIndex = R.findIndex(R.propEq('_name', this.operation))(commander.commands);
            this.keys = R.keys(commander.commands[this.apiCommandIndex]);

            // Used to record all stdout and stderr

            this.msgCatcher = {
                trace: '',
                debug: '',
                info: '',
                warn: '',
                error: '',
                fatal: '',
            };
            // private test data to mock ASK config file,
            // and record original process env var
            this._TEST_DATA = {
                ASK_CONFIG: {
                    profiles: {
                        default: {
                            token: testDataProvider.VALID_TOKEN.DEFAULT_PROFILE_TOKEN,
                            vendor_id: testDataProvider.VALID_VENDOR_ID.DEFAULT_VENDOR_ID,
                            aws_profile: 'DEFAULT_AWS_PROFILE'
                        },
                        TEST_VALID_PROFILE: {
                            token: testDataProvider.VALID_TOKEN.VALID_PROFILE_TOKEN,
                            vendor_id: testDataProvider.VALID_VENDOR_ID.VALID_VENDOR_ID,
                            aws_profile: 'VALID_AWS_PROFILE'
                        }
                    }
                },
                ORIGINAL_PROCESS_ENV_MAP: [
                    { name: 'ASK_DEFAULT_PROFILE', value: process.env.ASK_DEFAULT_PROFILE },
                    { name: 'AWS_ACCESS_KEY_ID', value: process.env.AWS_ACCESS_KEY_ID },
                    { name: 'AWS_SECRET_ACCESS_KEY', value: process.env.AWS_SECRET_ACCESS_KEY },
                    { name: 'ASK_REFRESH_TOKEN', value: process.env.ASK_REFRESH_TOKEN },
                    { name: 'ASK_ACCESS_TOKEN', value: process.env.ASK_ACCESS_TOKEN },
                    { name: 'ASK_VENDOR_ID', value: process.env.ASK_VENDOR_ID },
                    { name: 'ASK_DEFAULT_DEVICE_LOCALE', value: process.env.ASK_DEFAULT_DEVICE_LOCALE }
                ],
            };
        } catch (err) {
            throw err;
        }
    }

    async test() {
        try {
            // setup
            this.testSetUp();

            // call
            await commander.parseAsync(this.cmd.split(' '));
        } finally {
            this.expectationHandler(this.msgCatcher);
            // restore
            sinon.restore();
            this.processEnvSetBack();

            // Set commander back to original status
            const memoryKeys = R.difference(R.keys(commander.commands[this.apiCommandIndex]), this.keys);
            R.forEach((k) => { delete commander.commands[this.apiCommandIndex][k]; }, memoryKeys);
        }
    }

    testSetUp() {
        // modify the process.env to test env setting || ''
        this.processEnvSetup(this.envVar);

        sinon.stub(metricClient, 'sendData').resolves();

        // stdCacher is used to record messenger usage
        sinon.stub(Messenger.prototype, 'trace').callsFake((input) => {
            this.msgCatcher.trace += input;
        });
        sinon.stub(Messenger.prototype, 'debug').callsFake((input) => {
            this.msgCatcher.debug += input;
        });
        sinon.stub(Messenger.prototype, 'info').callsFake((input) => {
            this.msgCatcher.info += input;
        });
        sinon.stub(Messenger.prototype, 'warn').callsFake((input) => {
            this.msgCatcher.warn += input;
        });
        sinon.stub(Messenger.prototype, 'error').callsFake((input) => {
            this.msgCatcher.error += input;
        });
        sinon.stub(Messenger.prototype, 'fatal').callsFake((input) => {
            this.msgCatcher.fatal += input;
        });

        sinon.stub(process, 'exit');

        // Mock the real behaviour of tokenRefreshAndRead
        // Set the headers property of requestOption object
        // to correspoding token of the profile
        sinon.stub(AuthorizationController.prototype, 'tokenRefreshAndRead').callsFake((profile, cb) => {
            if (profile === CONSTANTS.PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME) {
                cb(null, testDataProvider.VALID_TOKEN.ENV_PROFILE_TOKEN);
            } else if (this._TEST_DATA.ASK_CONFIG.profiles[profile]) {
                cb(null, this._TEST_DATA.ASK_CONFIG.profiles[profile].token);
            }
        });

        // Mock OS file
        // Each time when CLI try to read .ask/cli_config file,
        // return static ASK_CONFIG object defined above instead
        const askCliConfig = path.join(os.homedir(), '.ask', 'cli_config');
        sinon.stub(fs, 'existsSync').withArgs(askCliConfig).returns(true);
        fs.existsSync.callThrough();
        sinon.stub(fs, 'readFileSync').withArgs(askCliConfig, 'utf-8').returns(JSON.stringify(this._TEST_DATA.ASK_CONFIG));
        fs.readFileSync.callThrough();
        sinon.stub(fs, 'accessSync').withArgs(askCliConfig, fs.constants.R_OK | fs.constants.W_OK).returns(true);
        fs.accessSync.callThrough();

        // Mock http server
        // According to input httpClienConfig,
        // decide the httpClient behaviours
        sinon.stub(httpClient, 'request');
        httpClient.request.callsArgWith(3, 'HTTP mock failed to handle the current input'); // set fallback when input misses
        this.httpMockConfig.forEach((config) => {
            httpClient.request
                .withArgs(...config.input, sinon.match.any, sinon.match.any)
                .callsArgWith(3, ...config.output);
        });
    }

    processEnvSetup(envVar) {
        this._TEST_DATA.ORIGINAL_PROCESS_ENV_MAP.forEach((key) => {
            process.env[key.name] = envVar[key.name] || '';
        });
        const remainingEnvs = R.difference(R.keys(envVar), this._TEST_DATA.ORIGINAL_PROCESS_ENV_MAP.keys());
        remainingEnvs.forEach((key) => {
            process.env[key] = envVar[key];
        });
    }

    processEnvSetBack() {
        this._TEST_DATA.ORIGINAL_PROCESS_ENV_MAP.forEach((key) => {
            process.env[key.name] = key.value;
        });
    }
}

ApiCommandBasicTest.testDataProvider = testDataProvider;

module.exports = ApiCommandBasicTest;
