const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const CLiError = require('@src/exceptions/cli-error');
const Messenger = require('@src/view/messenger');

/**
 * Class for git commands management
 */
module.exports = class GitClient {
    /**
     * Constructor for GitClient with projectPath and verbosity options
     * @param {string} projectPath the path of a project
     * @param {object} verbosityOptions | showOutput
     *                                  | showCommand
     */
    constructor(projectPath, verbosityOptions) {
        this.projectPath = projectPath;
        this.verbosityOptions = verbosityOptions;
    }

    /**
     * Execute git-init to create an empty Git repository or reinitialize an existing one
     */
    init() {
        const commands = [`git init "${this.projectPath}"${this.verbosityOptions.showOutput === false ? ' --quiet' : ''}`];
        const options = {
            showStdOut: this.verbosityOptions.showOutput,
            showStdErr: true,
            showCmd: this.verbosityOptions.showCommand
        };
        this._execCommands(commands, options);
    }

    /**
     * Config local git credential helper with credentialHelperPath
     * @param {string} credentialHelperPath the path of git credential helper
     * @param {string} hostUrl the host url to apply to the credential helper
     */
    configureCredentialHelper(credentialHelperPath, hostUrl) {
        const commands = [
            `git config --local credential.${hostUrl}.helper ""`,
            `git config --local --add credential.${hostUrl}.helper "!${credentialHelperPath}"`,
            `git config --local credential.${hostUrl}.UseHttpPath true`];
        const options = {
            showStdOut: this.verbosityOptions.showOutput,
            showStdErr: true,
            showCmd: this.verbosityOptions.showCommand,
            workingDir: this.projectPath
        };
        this._execCommands(commands, options);
    }

    /**
     *  Replace local git credential helper with credentialHelperPath
     * @param {string} credentialHelperPath the path of git credential helper
     */
    updateCredentialHelper(credentialHelperPath) {
        const commands = [
            `git config --local --replace-all credential.helper "!${credentialHelperPath}"`,
            'git config --local credential.UseHttpPath true'];
        const options = {
            showStdOut: this.verbosityOptions.showOutput,
            showStdErr: true,
            showCmd: this.verbosityOptions.showCommand,
            workingDir: this.projectPath
        };
        this._execCommands(commands, options);
    }

    /**
     * Add a new remote in the directory your repository is stored at
     * @param {String} repoUrl a remote url
     */
    addOrigin(repoUrl) {
        const commands = [`git remote add origin ${repoUrl}`];
        const options = {
            showStdOut: this.verbosityOptions.showOutput,
            showStdErr: true,
            showCmd: this.verbosityOptions.showCommand,
            workingDir: this.projectPath
        };
        this._execCommands(commands, options);
    }

    /**
     * Execute git fetch to fetch all remotes
     */
    fetchAll() {
        const commands = [`git fetch --all${this.verbosityOptions.showOutput === false ? ' --quiet' : ''}`];
        const options = {
            showStdOut: this.verbosityOptions.showOutput,
            showStdErr: false,
            showCmd: this.verbosityOptions.showCommand,
            workingDir: this.projectPath
        };
        this._execCommands(commands, options);
    }

    /**
     * Execute git checkout to switch branch or restore working tree files
     * @param {string} branch the branch name
     */
    checkoutBranch(branch) {
        const commands = [`git checkout ${branch}${this.verbosityOptions.showOutput === false ? ' --quiet' : ''}`];
        const options = {
            showStdOut: this.verbosityOptions.showOutput,
            showStdErr: true,
            showCmd: this.verbosityOptions.showCommand,
            workingDir: this.projectPath
        };
        this._execCommands(commands, options);
    }

    /**
     * Execute git clone to clone a repository into a new directory
     * @param {string} cloneUrl the clone url
     * @param {string} branch the branch name
     * @param {string} folderName the directory folder name
     */
    clone(cloneUrl, branch, folderName) {
        const commands = [`git clone --branch ${branch} ${cloneUrl} "${folderName}" ${this.verbosityOptions.showOutput === false ? ' --quiet' : ''}`];
        const options = {
            showStdOut: this.verbosityOptions.showOutput,
            showStdErr: true,
            showCmd: this.verbosityOptions.showCommand
        };
        this._execCommands(commands, options);
    }

    /**
     * Set up or update a gitignore file
     * @param {Array} filesToIgnore the list of files to ignore for git
     */
    setupGitIgnore(filesToIgnore) {
        const gitignorePath = path.join(this.projectPath, '.gitignore');
        if (fs.existsSync(gitignorePath) === false) {
            fs.writeFileSync(gitignorePath, `${filesToIgnore.join('\n')}`);
        } else {
            const gitignoreFile = fs.readFileSync(gitignorePath).toString();
            filesToIgnore.forEach((file) => {
                if (gitignoreFile.indexOf(file) === -1) {
                    fs.appendFileSync(gitignorePath, `\n${file}`);
                }
            });
        }
        this.add('.gitignore');
    }

    /**
     * Execute git add to add file contents to the index
     * @param {string} file the file to add content from
     */
    add(file) {
        const commands = [`git add "${file}"`];
        const options = {
            showStdOut: this.verbosityOptions.showOutput,
            showStdErr: true,
            showCmd: this.verbosityOptions.showCommand,
            workingDir: this.projectPath
        };
        this._execCommands(commands, options);
    }

    /**
     * Execute git delete to delete a local branch
     * @param {string} file the file to add content from
     */
    deleteBranch(branch) {
        const commands = [`git branch -d ${branch}`];
        const options = {
            showStdOut: this.verbosityOptions.showOutput,
            showStdErr: true,
            showCmd: this.verbosityOptions.showCommand
        };
        this._execCommands(commands, options);
    }

    /**
     * Execute git merge to join two development histories together
     * @param {String} branch the development branch
     */
    merge(branch) {
        const commands = [`git merge ${branch}`];
        const options = {
            showStdOut: this.verbosityOptions.showOutput,
            showStdErr: true,
            showCmd: this.verbosityOptions.showCommand
        };
        this._execCommands(commands, options);
    }

    /**
     * Execute git status to show the working tree status in short-format
     * @param {callback} callback { error }
     */
    shortStatus() {
        const command = 'git status -s';
        const options = {
            showStdOut: this.verbosityOptions.showOutput,
            showStdErr: true,
            showCmd: this.verbosityOptions.showCommand
        };
        try {
            return this._execChildProcessSync(command, options);
        } catch (ex) {
            throw new CLiError(`${ex}`);
        }
    }

    /**
     * Execute git rev-list to count the list of commit objects
     * @param {String} commit1 the first commit
     * @param {String} commit2 the second commit
     * @param {callback} callback { error }
     */
    countCommitDifference(commit1, commit2) {
        const command = `git rev-list --count ${commit1}...${commit2}`;
        const options = {
            showStdOut: this.verbosityOptions.showOutput,
            showStdErr: true,
            showCmd: this.verbosityOptions.showCommand,
            workingDir: this.projectPath
        };
        try {
            return this._execChildProcessSync(command, options);
        } catch (ex) {
            throw new CLiError(`${ex}`);
        }
    }

    _execCommands(commands, options) {
        for (const command of commands) {
            try {
                this._execChildProcessSync(command, options);
            } catch (ex) {
                throw new CLiError(`${ex}`);
            }
        }
    }

    _execChildProcessSync(command, options) {
        const { showOutput, showStdErr, showCommand, workingDir } = options;
        const execOptions = {
            stdio: [null, showOutput ? 1 : null, showStdErr ? 2 : null],
            shell: true,
            windowsHide: true
        };
        if (workingDir) {
            execOptions.cwd = options.workingDir;
        }
        if (showCommand) {
            Messenger.getInstance().info(command);
        }
        return execSync(command, execOptions);
    }
};
