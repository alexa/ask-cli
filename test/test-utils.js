const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const KeySymbol = {
    DOWN: '\x1B\x5B\x42',
    UP: '\x1B\x5B\x41',
    ENTER: '\x0D',
    SPACE: '\x20'
};

const MockServerPort = {
    SMAPI: 4010,
    LWA: 4011
};

const tempDirectory = path.join(process.cwd(), 'test/temp');

const resetTempDirectory = () => {
    fs.ensureDirSync(tempDirectory);
    fs.emptyDirSync(tempDirectory);
};

const getPathInTempDirectory = (folderPath) => path.join(tempDirectory, folderPath);

const makeFolderInTempDirectory = (folderPath) => {
    fs.ensureDirSync(getPathInTempDirectory(folderPath));
};

const run = (cmd, args, options = {}) => {
    const inputs = options.inputs || [];
    const parse = options.parse || false;
    const returnProcessHandle = options.returnProcessHandle || false;
    const cwd = options.cwd || tempDirectory;
    const env = { ...process.env, ...options.env };

    fs.ensureDirSync(cwd);

    const childProcess = spawn(cmd, args, { cwd, env, stdio: [null, null, null, 'ipc'] });

    return new Promise((resolve, reject) => {
        let output = '';
        let errorMessage = '';
        const processStream = (data, isError = false) => {
            const dataStr = data.toString();
            if (isError) {
                errorMessage += dataStr;
            } else {
                output += dataStr;
            }
            if (process.env.DEBUG) {
                console.log(dataStr);
            }
            return dataStr;
        };
        const processData = (data) => processStream(data);
        const processError = (data) => processStream(data, true);

        childProcess.stdout.on('data', (data) => {
            const dataStr = processData(data);

            const index = inputs.findIndex(i => dataStr.includes(i.match));
            if (index > -1) {
                const { input } = inputs[index];
                inputs.splice(index, 1);
                const value = input ? `${input}${KeySymbol.ENTER}` : KeySymbol.ENTER;
                childProcess.stdin.write(value);
            }
            if (returnProcessHandle && inputs.length === 0) {
                resolve(childProcess);
            }
        });

        childProcess.stderr.on('data', (data) => {
            errorMessage = processError(data);
        });

        childProcess.on('close', (code) => {
            if (code) {
                reject(new Error(`${output}${errorMessage}`));
            } else {
                output = parse ? JSON.parse(output) : output;
                resolve(output);
            }
        });
    });
};

const _startMockServer = async (port, swaggerSpecPath) => {
    const inputs = [
        { match: 'Prism is listening on' }
    ];
    const args = ['run', 'prism', '--', 'mock', '-p', port, swaggerSpecPath];
    const options = { returnProcessHandle: true, inputs, cwd: process.cwd() };
    return run('npm', args, options);
};

const startMockSmapiServer = () => _startMockServer(MockServerPort.SMAPI, 'node_modules/ask-smapi-model/spec.json');
const startMockLwaServer = () => _startMockServer(MockServerPort.LWA, 'test/integration/fixtures/lwa-swagger.json');

module.exports = {
    KeySymbol,
    getPathInTempDirectory,
    makeFolderInTempDirectory,
    resetTempDirectory,
    run,
    startMockSmapiServer,
    startMockLwaServer,
    MockServerPort
};
