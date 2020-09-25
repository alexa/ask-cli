const { expect } = require('chai');
const parallel = require('mocha.parallel');
const { run, KeySymbol, resetTempDirectory, getPathInTempDirectory, makeFolderInTempDirectory } = require('@test/test-utils');

parallel('high level commands test', () => {
    let cmd;

    before(() => {
        resetTempDirectory();
    });

    beforeEach(() => {
        cmd = 'ask';
    });

    it('| should init new skill', async () => {
        const folderName = 'new-skill';
        makeFolderInTempDirectory(`${folderName}/skill-package`);
        makeFolderInTempDirectory(`${folderName}/lambda`);

        const cwd = getPathInTempDirectory(folderName);

        const args = ['init'];
        const inputs = [
            { match: '? Skill Id' },
            { match: '? Skill package path' },
            { match: '? Lambda code path' },
            { match: '? Use AWS CloudFormation', input: 'n' },
            { match: '? Lambda runtime' },
            { match: '? Lambda handler' },
            { match: '? Does this look correct?' }
        ];

        const result = await run(cmd, args, { inputs, cwd });

        expect(result).include('succeeded');
    });

    it('| should set up, deploy, clone hosted skill', async () => {
        let folderName = 'hosted-skill';
        // new
        let args = ['new'];
        let inputs = [
            { match: '? Choose the programming language' },
            { match: '? Choose a method to host your skill' },
            { match: '? Choose the default locale for your skill' },
            { match: '? Choose the default region for your skill' },
            { match: '? Please type in your skill name' },
            { match: '? Please type in your folder name', input: folderName }
        ];

        let result = await run(cmd, args, { inputs });

        expect(result).include('Hosted skill provisioning finished');

        // deploy
        let cwd = getPathInTempDirectory(folderName);
        cmd = 'git';
        args = ['add', '.'];
        await run(cmd, args, { cwd });

        args = ['commit', '-m', '"test"'];
        await run(cmd, args, { cwd });

        args = ['push'];
        result = await run(cmd, args, { cwd });

        expect(result).include('After the code pushed, please check the deployment status');

        const skillId = result.match(/(amzn1\.ask\.skill\.[a-z0-9-]*)/m)[0];

        folderName = 'cloned-hosted-skill';
        cwd = getPathInTempDirectory(folderName);
        cmd = 'ask';
        args = ['init', '--hosted-skill-id', skillId];
        inputs = [
            { match: '? Please type in your folder name', input: folderName }
        ];

        result = await run(cmd, args, { inputs, cwd });

        expect(result).include('successfully initialized');
    });

    it('| should set up and deploy skill with cloud formation deployer', async () => {
        const folderName = 'cf-deployer-skill';
        // new
        let args = ['new'];
        const inputs = [
            { match: '? Choose the programming language' },
            { match: '? Choose a method to host your skill', input: KeySymbol.DOWN },
            { match: '? Choose a template to start with' },
            { match: '? Please type in your skill name' },
            { match: '? Please type in your folder name', input: folderName }
        ];

        let result = await run(cmd, args, { inputs });

        expect(result).include('Project initialized with deploy delegate "@ask-cli/cfn-deployer" successfully');

        // deploy
        const cwd = getPathInTempDirectory(folderName);
        args = ['deploy'];

        result = await run(cmd, args, { cwd });

        expect(result).include('Skill infrastructures deployed successfully through @ask-cli/cfn-deployer');
    });

    it('| should set up and deploy skill with lambda deployer', async () => {
        const folderName = 'lambda-skill';
        // new
        let args = ['new'];
        const inputs = [
            { match: '? Choose the programming language' },
            { match: '? Choose a method to host your skill', input: `${KeySymbol.DOWN}${KeySymbol.DOWN}` },
            { match: '? Choose a template to start with' },
            { match: '? Please type in your skill name', input: folderName },
            { match: '? Please type in your folder name', input: folderName }
        ];

        let result = await run(cmd, args, { inputs });

        expect(result).include('Project initialized with deploy delegate "@ask-cli/lambda-deployer" successfully');

        // deploy
        const cwd = getPathInTempDirectory(folderName);
        args = ['deploy'];

        result = await run(cmd, args, { cwd });

        expect(result).include('Skill infrastructures deployed successfully through @ask-cli/lambda-deployer');
    });
});
