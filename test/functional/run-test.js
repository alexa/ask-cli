require('module-alias/register');

process.env.ASK_SHARE_USAGE = false;

[
    '@test/functional/commands/high-level-commands-test.js'
].forEach((testFile) => {
    // eslint-disable-next-line global-require
    require(testFile);
});
