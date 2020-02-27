const { execSync } = require('child_process');
const fs = require('fs-extra');
const git = require('simple-git');
const path = require('path');

const Messenger = require('@src/view/messenger');

module.exports = {
    init,
    configureCredentialHelper,
    addOrigin,
    fetchAll,
    checkoutBranch,
    add,
    clone,
    setupGitIgnore
};

const isWindows = process.platform === 'win32';
// eslint-disable-next-line quotes
const QUOTES = isWindows ? `"` : `'`;

function init(projectPath, verbosityOptions) {
    const commands = [`git init ${QUOTES}${projectPath}${QUOTES}${verbosityOptions.showOutput === false ? ' --quiet' : ''}`];
    const options = { showStdOut: verbosityOptions.showOutput, showStdErr: true, showCmd: verbosityOptions.showCommand };
    for (const command of commands) {
        try {
            _execChildProcessSync(command, options);
        } catch (ex) {
            throw new Error(`${command} Failed.`);
        }
    }
}

function configureCredentialHelper(projectPath, credentialHelperPath, verbosityOptions) {
    const commands = [`git config --local credential.helper ${QUOTES}${QUOTES}`,
        `git config --local --add credential.helper ${QUOTES}!${credentialHelperPath}${QUOTES}`,
        'git config --local credential.UseHttpPath true'];
    const options = { showStdOut: verbosityOptions.showOutput, showStdErr: true, showCmd: verbosityOptions.showCommand, workingDir: projectPath };
    for (const command of commands) {
        try {
            _execChildProcessSync(command, options);
        } catch (ex) {
            throw new Error(`${command} Failed.`);
        }
    }
}

function addOrigin(projectPath, repoUrl, verbosityOptions) {
    const commands = [`git remote add origin ${repoUrl}`];
    const options = { showStdOut: verbosityOptions.showOutput, showStdErr: true, showCmd: verbosityOptions.showCommand, workingDir: projectPath };
    for (const command of commands) {
        try {
            _execChildProcessSync(command, options);
        } catch (ex) {
            throw new Error(`${command} Failed.`);
        }
    }
}

function fetchAll(projectPath, verbosityOptions) {
    const commands = [`git fetch --all${verbosityOptions.showOutput === false ? ' --quiet' : ''}`];
    const options = { showStdOut: verbosityOptions.showOutput, showStdErr: false, showCmd: verbosityOptions.showCommand, workingDir: projectPath };
    for (const command of commands) {
        try {
            _execChildProcessSync(command, options);
        } catch (ex) {
            throw new Error(`${command} Failed.`);
        }
    }
}

function checkoutBranch(projectPath, branch, verbosityOptions) {
    const commands = [`git checkout ${branch}${verbosityOptions.showOutput === false ? ' --quiet' : ''}`];
    const options = { showStdOut: verbosityOptions.showOutput, showStdErr: true, showCmd: verbosityOptions.showCommand, workingDir: projectPath };
    for (const command of commands) {
        try {
            _execChildProcessSync(command, options);
        } catch (ex) {
            throw new Error(`${command} Failed.`);
        }
    }
}

function add(repoDir, projectPath, verbosityOptions) {
    const commands = [`git add ${QUOTES}${projectPath}${QUOTES}`];
    const options = { showStdOut: verbosityOptions.showOutput, showStdErr: true, showCmd: verbosityOptions.showCommand, workingDir: repoDir };
    for (const command of commands) {
        try {
            _execChildProcessSync(command, options);
        } catch (ex) {
            throw new Error(`${command} Failed.`);
        }
    }
}

function clone(cloneUrl, branch, cloneDir, callback) {
    const cloneOption = [];
    if (branch) {
        cloneOption.push('-b');
        cloneOption.push(branch);
    }
    git().silent(true).clone(cloneUrl, cloneDir, cloneOption, (err) => {
        callback(err);
    });
}

function setupGitIgnore(projectPath, filesToIgnore, verbosityOptions) {
    const gitignorePath = path.join(projectPath, '.gitignore');
    if (fs.existsSync(gitignorePath) === false) {
        fs.writeFileSync(gitignorePath, `${filesToIgnore.join('\n')}`);
    } else {
        const gitignoreFile = fs.readFileSync(gitignorePath);
        filesToIgnore.forEach((file) => {
            if (gitignoreFile.toString().indexOf(file) === -1) {
                fs.appendFileSync(gitignorePath, `\n${file}`);
            }
        });
    }
    add(projectPath, '.gitignore', verbosityOptions);
}

function _execChildProcessSync(command, options) {
    const { showStdOut, showStdErr, showCmd, workingDir } = options;
    const execOptions = {
        stdio: [null, showStdOut ? 1 : null, showStdErr ? 2 : null],
        shell: true,
        windowsHide: true
    };
    if (workingDir) {
        execOptions.cwd = options.workingDir;
    }
    if (showCmd) {
        Messenger.getInstance().info(command);
    }
    return execSync(command, execOptions);
}
