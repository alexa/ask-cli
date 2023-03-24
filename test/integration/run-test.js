process.env.ASK_SHARE_USAGE = false;

const tests = ["./code-builder/code-builder-test.js"];

if (process.platform !== 'win32') {
    // smapi tests are not supported on windows
    tests.push('./commands/smapi-commands-test.js');
}
tests.forEach((testFile) => {
  // eslint-disable-next-line global-require
  require(testFile);
});
