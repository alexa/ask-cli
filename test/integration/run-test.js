require('module-alias/register');

[
    '@test/integration/commands/smapi-commands-test.js'
].forEach((testFile) => {
    // eslint-disable-next-line global-require
    require(testFile);
});
