
const { expect } = require('chai');
const fs = require('fs-extra');
const sinon = require('sinon');
const path = require('path');
const proxyquire = require('proxyquire');

const GitClient = require('@src/clients/git-client');
const CLiError = require('@src/exceptions/cli-error');
const Messenger = require('@src/view/messenger');

describe('Clients test - cli git client', () => {
    const TEST_ERROR = 'TEST_ERROR';
    const TEST_PROJECT_PATH = 'TEST_PROJECT_PATH';
    const TEST_VERBOSITY_OPTIONS = {
        showOutput: false,
        showCommand: false,
        showStdErr: false,
        workingDir: TEST_PROJECT_PATH
    };
    const TEST_VERBOSITY_OPTIONS_DEBUG = {
        showOutput: true,
        showCommand: true,
        showStdErr: true
    };

    describe('# inspect correctness for constructor', () => {
        it('| initiate as a GitClient class', () => {
            // call
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
            // verify
            expect(gitClient).to.be.instanceOf(GitClient);
            expect(gitClient.projectPath).equal(TEST_PROJECT_PATH);
            expect(gitClient.verbosityOptions.showOutput).equal(false);
            expect(gitClient.verbosityOptions.showCommand).equal(false);
        });
    });

    describe('# test init', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| test git init fails', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
            sinon.stub(gitClient, '_execChildProcessSync').throws(new CLiError(TEST_ERROR));
            // call & verify
            expect(() => gitClient.init()).throw(CLiError, `CliError: ${TEST_ERROR}`);
        });

        it('| test git init succeed', () => {
            // setup
            const TEST_COMMAND = `git init "${TEST_PROJECT_PATH}"${TEST_VERBOSITY_OPTIONS_DEBUG.showOutput === false ? ' --quiet' : ''}`;
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS_DEBUG);
            sinon.stub(gitClient, '_execChildProcessSync');
            // call
            gitClient.init();
            // verify
            expect(gitClient._execChildProcessSync.args[0][0]).eq(TEST_COMMAND);
        });
    });

    describe('# test configureCredentialHelper', () => {
        const TEST_CREDENTIAL_HELPER_PATH = 'TEST_CREDENTIAL_HELPER_PATH';
        const TEST_GIT_HOST_URL = 'SOME_URL';
        const TEST_COMMAND = [
            `git config --local credential.${TEST_GIT_HOST_URL}.helper ""`,
            `git config --local --add credential.${TEST_GIT_HOST_URL}.helper "!${TEST_CREDENTIAL_HELPER_PATH}"`,
            `git config --local credential.${TEST_GIT_HOST_URL}.UseHttpPath true`];

        afterEach(() => {
            sinon.restore();
        });

        it('| test git configureCredentialHelper execute commands correctly ', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
            sinon.stub(gitClient, '_execChildProcessSync');
            // call
            gitClient.configureCredentialHelper(TEST_CREDENTIAL_HELPER_PATH, TEST_GIT_HOST_URL);
            // verify
            expect(gitClient._execChildProcessSync.callCount).eq(3);
            expect(gitClient._execChildProcessSync.args[0][0]).eq(TEST_COMMAND[0]);
            expect(gitClient._execChildProcessSync.args[1][0]).eq(TEST_COMMAND[1]);
            expect(gitClient._execChildProcessSync.args[2][0]).eq(TEST_COMMAND[2]);
        });

        it('| test git configureCredentialHelper fails', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS_DEBUG);
            sinon.stub(gitClient, '_execChildProcessSync').throws(new CLiError(`${TEST_ERROR}`));
            // call & verify
            expect(() => gitClient.configureCredentialHelper(TEST_CREDENTIAL_HELPER_PATH)).throw(CLiError, `CliError: ${TEST_ERROR}`);
        });
    });

    describe('# test updateCredentialHelper', () => {
        const TEST_CREDENTIAL_HELPER_PATH = 'TEST_CREDENTIAL_HELPER_PATH';
        const TEST_COMMAND = [
            `git config --local --replace-all credential.helper "!${TEST_CREDENTIAL_HELPER_PATH}"`,
            'git config --local credential.UseHttpPath true'];

        afterEach(() => {
            sinon.restore();
        });

        it('| test git updateCredentialHelper execute commands correctly ', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
            sinon.stub(gitClient, '_execChildProcessSync');
            // call
            gitClient.updateCredentialHelper(TEST_CREDENTIAL_HELPER_PATH);
            // verify
            expect(gitClient._execChildProcessSync.callCount).eq(2);
            expect(gitClient._execChildProcessSync.args[0][0]).eq(TEST_COMMAND[0]);
            expect(gitClient._execChildProcessSync.args[1][0]).eq(TEST_COMMAND[1]);
        });

        it('| test git updateCredentialHelper fails', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS_DEBUG);
            sinon.stub(gitClient, '_execChildProcessSync').throws(new CLiError(`${TEST_ERROR}`));
            // call & verify
            expect(() => gitClient.updateCredentialHelper(TEST_CREDENTIAL_HELPER_PATH)).throw(CLiError, `CliError: ${TEST_ERROR}`);
        });
    });

    describe('# test addOrigin', () => {
        const TEST_REPO_URL = 'TEST_REPO_URL';
        const TEST_COMMAND = [`git remote add origin ${TEST_REPO_URL}`];

        afterEach(() => {
            sinon.restore();
        });

        it('| test git addOrigin execute commands correctly ', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
            sinon.stub(gitClient, '_execChildProcessSync');
            // call
            gitClient.addOrigin(TEST_REPO_URL);
            // verify
            expect(gitClient._execChildProcessSync.callCount).eq(1);
            expect(gitClient._execChildProcessSync.args[0][0]).eq(TEST_COMMAND[0]);
        });

        it('| test git addOrigin fails', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS_DEBUG);
            sinon.stub(gitClient, '_execChildProcessSync').throws(new CLiError(`${TEST_ERROR}`));
            // call & verify
            expect(() => gitClient.addOrigin(TEST_REPO_URL)).throw(CLiError, `CliError: ${TEST_ERROR}`);
        });
    });

    describe('# test fetchAll', () => {
        const TEST_COMMAND = [`git fetch --all${TEST_VERBOSITY_OPTIONS.showOutput === false ? ' --quiet' : ''}`];

        afterEach(() => {
            sinon.restore();
        });

        it('| test git fetchAll execute commands correctly ', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
            sinon.stub(gitClient, '_execChildProcessSync');
            // call
            gitClient.fetchAll();
            // verify
            expect(gitClient._execChildProcessSync.callCount).eq(1);
            expect(gitClient._execChildProcessSync.args[0][0]).eq(TEST_COMMAND[0]);
        });

        it('| test git fetchAll fails', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS_DEBUG);
            sinon.stub(gitClient, '_execChildProcessSync').throws(new CLiError(`${TEST_ERROR}`));
            // call & verify
            expect(() => gitClient.fetchAll()).throw(CLiError, `CliError: ${TEST_ERROR}`);
        });
    });

    describe('# test checkoutBranch', () => {
        const TEST_BRANCH = 'ASK-CLI';
        const TEST_COMMAND = [`git checkout ${TEST_BRANCH}${TEST_VERBOSITY_OPTIONS.showOutput === false ? ' --quiet' : ''}`];

        afterEach(() => {
            sinon.restore();
        });

        it('| test git checkoutBranch execute commands correctly ', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
            sinon.stub(gitClient, '_execChildProcessSync');
            // call
            gitClient.checkoutBranch(TEST_BRANCH);
            // verify
            expect(gitClient._execChildProcessSync.callCount).eq(1);
            expect(gitClient._execChildProcessSync.args[0][0]).eq(TEST_COMMAND[0]);
        });

        it('| test git checkoutBranch fails', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS_DEBUG);
            sinon.stub(gitClient, '_execChildProcessSync').throws(new CLiError(`${TEST_ERROR}`));
            // call & verify
            expect(() => gitClient.checkoutBranch(TEST_BRANCH)).throw(CLiError, `CliError: ${TEST_ERROR}`);
        });
    });

    describe('# git clone', () => {
        const TEST_FOLDER_NAME = 'TEST_FOLDER_NAME';
        const TEST_CLONE_URL = 'https://test.git';
        const TEST_BRANCH = 'ASK-CLI';
        const TEST_COMMAND = [`git clone --branch ${TEST_BRANCH} ${TEST_CLONE_URL} "${TEST_FOLDER_NAME}" `
        + `${TEST_VERBOSITY_OPTIONS.showOutput === false ? ' --quiet' : ''}`];

        afterEach(() => {
            sinon.restore();
        });

        it('| test git clone execute commands correctly ', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
            sinon.stub(gitClient, '_execChildProcessSync');
            // call
            gitClient.clone(TEST_CLONE_URL, TEST_BRANCH, TEST_FOLDER_NAME);
            // verify
            expect(gitClient._execChildProcessSync.callCount).eq(1);
            expect(gitClient._execChildProcessSync.args[0][0]).eq(TEST_COMMAND[0]);
        });

        it('| test git clone fails', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS_DEBUG);
            sinon.stub(gitClient, '_execChildProcessSync').throws(new CLiError(`${TEST_ERROR}`));
            // call & verify
            expect(() => gitClient.clone(TEST_CLONE_URL, TEST_BRANCH, TEST_FOLDER_NAME)).throw(CLiError, `CliError: ${TEST_ERROR}`);
        });
    });

    describe('# git add', () => {
        const TEST_REPO_DIR = 'repoDir';
        const TEST_COMMAND = [`git add "${TEST_REPO_DIR}"`];

        afterEach(() => {
            sinon.restore();
        });

        it('| test git add execute commands correctly ', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
            sinon.stub(gitClient, '_execChildProcessSync');
            // call
            gitClient.add(TEST_REPO_DIR);
            // verify
            expect(gitClient._execChildProcessSync.callCount).eq(1);
            expect(gitClient._execChildProcessSync.args[0][0]).eq(TEST_COMMAND[0]);
        });

        it('| test git add fails', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS_DEBUG);
            sinon.stub(gitClient, '_execChildProcessSync').throws(new CLiError(`${TEST_ERROR}`));
            // call & verify
            expect(() => gitClient.add(TEST_REPO_DIR)).throw(CLiError, `CliError: ${TEST_ERROR}`);
        });
    });

    describe('# git deleteBranch', () => {
        const TEST_BRANCH = 'dev';
        const TEST_COMMAND = [`git branch -d ${TEST_BRANCH}`];

        afterEach(() => {
            sinon.restore();
        });

        it('| test git delete execute commands correctly ', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
            sinon.stub(gitClient, '_execChildProcessSync');
            // call
            gitClient.deleteBranch(TEST_BRANCH);
            // verify
            expect(gitClient._execChildProcessSync.callCount).eq(1);
            expect(gitClient._execChildProcessSync.args[0][0]).eq(TEST_COMMAND[0]);
        });

        it('| test git add fails', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS_DEBUG);
            sinon.stub(gitClient, '_execChildProcessSync').throws(new CLiError(`${TEST_ERROR}`));
            // call & verify
            expect(() => gitClient.deleteBranch(TEST_BRANCH)).throw(CLiError, `CliError: ${TEST_ERROR}`);
        });
    });

    describe('# git merge', () => {
        const TEST_BRANCH = 'dev';
        const TEST_COMMAND = [`git merge ${TEST_BRANCH}`];

        afterEach(() => {
            sinon.restore();
        });

        it('| test git merge execute commands correctly ', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
            sinon.stub(gitClient, '_execChildProcessSync');
            // call
            gitClient.merge(TEST_BRANCH);
            // verify
            expect(gitClient._execChildProcessSync.callCount).eq(1);
            expect(gitClient._execChildProcessSync.args[0][0]).eq(TEST_COMMAND[0]);
        });

        it('| test git merge fails', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS_DEBUG);
            sinon.stub(gitClient, '_execChildProcessSync').throws(new CLiError(`${TEST_ERROR}`));
            // call & verify
            expect(() => gitClient.merge(TEST_BRANCH)).throw(CLiError, `CliError: ${TEST_ERROR}`);
        });
    });

    describe('# git shortStatus', () => {
        const TEST_COMMAND = 'git status -s';

        afterEach(() => {
            sinon.restore();
        });

        it('| test git status execute commands correctly ', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
            const TEST_STDOUT = 'stdout';
            sinon.stub(gitClient, '_execChildProcessSync').returns(TEST_STDOUT);
            // call
            const res = gitClient.shortStatus();
            // verify
            expect(res).equal(TEST_STDOUT);
            expect(gitClient._execChildProcessSync.callCount).eq(1);
            expect(gitClient._execChildProcessSync.args[0][0]).eq(TEST_COMMAND);
        });

        it('| test git status fails', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
            sinon.stub(gitClient, '_execChildProcessSync').throws(new CLiError(`${TEST_ERROR}`));
            // call & verify
            expect(() => gitClient.shortStatus()).throw(CLiError, `CliError: ${TEST_ERROR}`);
        });
    });

    describe('# git countCommitDifference', () => {
        const COMMIT1 = 'origin/dev';
        const COMMIT2 = 'dev';
        const TEST_COMMAND = `git rev-list --count ${COMMIT1}...${COMMIT2}`;

        afterEach(() => {
            sinon.restore();
        });

        it('| test git rev-list --count execute commands correctly ', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);
            const TEST_STDOUT = 'stdout';
            sinon.stub(gitClient, '_execChildProcessSync').returns(TEST_STDOUT);
            // call
            const res = gitClient.countCommitDifference(COMMIT1, COMMIT2);
            // verify
            expect(res).equal(TEST_STDOUT);
            expect(gitClient._execChildProcessSync.callCount).eq(1);
            expect(gitClient._execChildProcessSync.args[0][0]).eq(TEST_COMMAND);
        });

        it('| test git rev-list --count fails', () => {
            // setup
            const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS_DEBUG);
            sinon.stub(gitClient, '_execChildProcessSync').throws(new CLiError(`${TEST_ERROR}`));
            // call & verify
            expect(() => gitClient.countCommitDifference(COMMIT1, COMMIT2)).throw(CLiError, `CliError: ${TEST_ERROR}`);
        });
    });

    describe('# test setupGitIgnore', () => {
        const TEST_FILES_TO_IGNORE = ['.file_one', '.file_two'];
        const TEST_GIT_IGNORE = 'TEST_GIT_IGNORE';
        const gitClient = new GitClient(TEST_PROJECT_PATH, TEST_VERBOSITY_OPTIONS);

        afterEach(() => {
            sinon.restore();
        });

        it('| test .gitignore file does not exist ', () => {
            // setup
            sinon.stub(path, 'join').returns(TEST_GIT_IGNORE);
            sinon.stub(fs, 'existsSync').returns(false);
            const writeFileStub = sinon.stub(fs, 'writeFileSync');
            sinon.stub(gitClient, 'add');
            // call
            gitClient.setupGitIgnore(TEST_FILES_TO_IGNORE);
            // verify
            expect(writeFileStub.args[0][0]).eq(TEST_GIT_IGNORE);
            expect(writeFileStub.args[0][1]).eq('.file_one\n.file_two');
        });

        it('| test .gitignore file not exists ', () => {
            // setup
            sinon.stub(path, 'join').returns(TEST_GIT_IGNORE);
            sinon.stub(fs, 'existsSync').returns(true);
            const writeFileStub = sinon.stub(fs, 'readFileSync').returns('.file_one');
            const appendFileStub = sinon.stub(fs, 'appendFileSync');
            sinon.stub(gitClient, 'add');
            // call
            gitClient.setupGitIgnore(TEST_FILES_TO_IGNORE);
            // verify
            expect(writeFileStub.callCount).eq(1);
            expect(appendFileStub.args[0][0]).eq(TEST_GIT_IGNORE);
        });
    });

    describe('# test _execChildProcessSync', () => {
        let infoStub;
        const TEST_COMMAND = 'TEST_COMMAND';

        beforeEach(() => {
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| test _execChildProcessSync succeeds ', () => {
            // setup
            const childProcessStub = {
                execSync: () => {}
            };
            const proxyHelper = proxyquire('@src/clients/git-client', {
                child_process: childProcessStub
            });
            // call
            proxyHelper.prototype._execChildProcessSync(TEST_COMMAND, TEST_VERBOSITY_OPTIONS_DEBUG);
            // verify
            expect(infoStub.args[0][0]).eq(TEST_COMMAND);
        });

        it('| test _execChildProcessSync fails ', () => {
            // setup
            const childProcessStub = {
                execSync: () => { throw new Error(TEST_ERROR); }
            };
            const proxyHelper = proxyquire('@src/clients/git-client', {
                child_process: childProcessStub
            });
            // call & verify
            expect(() => proxyHelper.prototype._execChildProcessSync(TEST_COMMAND, TEST_VERBOSITY_OPTIONS))
                .throw(Error, `${TEST_ERROR}`);
        });
    });
});
