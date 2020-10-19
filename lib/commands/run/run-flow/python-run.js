const childprocess = require('child_process');
const path = require('path');
const fs = require('fs');
const CONSTANTS = require('@src/utils/constants');
const CliError = require('@src/exceptions/cli-error');
const AbstractRunFlow = require('./abstract-run-flow');

class PythonRunFlow extends AbstractRunFlow {
    static canHandle(runtime) {
        return runtime === CONSTANTS.RUNTIME.PYTHON;
    }

    constructor({ skillInvocationInfo, waitForAttach, debugPort, token, skillId, runRegion, watch }) {
        const sitePkgLocationsStr = childprocess.execSync('python3 -c "import site; import json; print(json.dumps(site.getsitepackages()))"')
            .toString();
        const sitePkgLocations = JSON.parse(sitePkgLocationsStr);
        const localDebuggerPath = sitePkgLocations
            .map(location => path.join(location, CONSTANTS.RUN.PYTHON.SCRIPT_LOCATION))
            .find(location => fs.existsSync(location));
        if (!fs.existsSync(localDebuggerPath)) {
            throw new CliError('ask-sdk-local-debug cannot be found. Please install ask-sdk-local-debug to your skill code project. '
            + 'Refer https://pypi.org/project/ask-sdk-local-debug, for more info.');
        }
        if (waitForAttach) {
            childprocess.execSync('python3 -m pip install debugpy', { stdio: 'inherit' });
        }
        const execMap = waitForAttach ? {
            py: `python3 -m debugpy --listen ${debugPort} --wait-for-client`,
        } : {
            py: 'python3'
        };
        super({
            execMap,
            script: localDebuggerPath,
            args: ['--accessToken', `"${token}"`, '--skillId', skillId,
                '--skillHandler', skillInvocationInfo.handlerName,
                '--skillFilePath', path.join(`${skillInvocationInfo.skillCodeFolderName}`, `${skillInvocationInfo.skillFileName}.py`),
                '--region', runRegion],
            ext: 'py,json,txt',
            watch: watch ? `${skillInvocationInfo.skillCodeFolderName}` : watch
        });
    }
}

module.exports = PythonRunFlow;
