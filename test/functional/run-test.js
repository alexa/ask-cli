process.env.ASK_SHARE_USAGE = false;

["./commands/high-level-commands-test.js"].forEach((testFile) => {
  // eslint-disable-next-line global-require
  require(testFile);
});
