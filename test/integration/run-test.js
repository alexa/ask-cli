require('module-alias/register');

process.env.ASK_SHARE_USAGE = false;

const tests = [
    '@test/integration/code-builder/code-builder-test.js'
];

if (process.platform !== 'win32') {
    // smapi tests are not supported on windows
    tests.push('@test/integration/commands/smapi-commands-test.js');
}
tests.forEach((testFile) => {
    // eslint-disable-next-line global-require
    require(testFile);
});
