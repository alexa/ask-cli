require('module-alias/register');

process.env.ASK_SHARE_USAGE = false;

[
    '@test/integration/commands/smapi-commands-test.js'
].forEach((testFile) => {
    // eslint-disable-next-line global-require
    require(testFile);
});
