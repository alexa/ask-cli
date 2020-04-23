require('module-alias/register');

[
    '@test/functional/commands/high-level-commands-test.js'
].forEach((testFile) => {
    // eslint-disable-next-line global-require
    require(testFile);
});
