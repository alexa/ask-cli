const { expect } = require('chai');
const parallel = require('mocha.parallel');
const sinon = require('sinon');
const { run, addFixtureDirectoryToPaths } = require('@test/test-utils');

parallel('plugin test', () => {

    const sandbox = sinon.createSandbox();

    beforeEach(() => {
        cmd = 'ask';
        let env_path = process.env.PATH;

        env_path = addFixtureDirectoryToPaths(env_path);

        sandbox.stub(process.env, 'PATH').value(env_path);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('| should warn of attempt to override core command', async () => {

        let args = []
        const result = await run(cmd, args);

        expect(result).include('ask-new is overshadowed by a core command');
    });

    it('| should warn of duplicate command', async () => {

        let args = [];
        const result = await run(cmd, args);

        expect(result).include('ask-sample is overshadowed by a plugin with the same name');
    });
});