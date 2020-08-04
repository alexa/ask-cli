require('module-alias/register');

process.env.ASK_SHARE_USAGE = false;

/**
 * This list manages all the files we want to cover during the refactor.
 * Please also include the test-ready module in package.json's "nyc.include" list.
 * Make sure test coverage meets the bar.
 */
[
    // UNIT TEST
    // builtins
    '@test/unit/builtins/lambda-deployer/index-test.js',
    '@test/unit/builtins/lambda-deployer/helper-test.js',
    // commands
    '@test/unit/commands/option-validator-test',
    '@test/unit/commands/abstract-command-test',
    // command - util
    '@test/unit/commands/util/git-credentials-helper/index-test',
    '@test/unit/commands/util/generate-lwa-tokens/index-test',
    // command - new
    '@test/unit/commands/new/index-test',
    '@test/unit/commands/new/ui-test',
    '@test/unit/commands/new/helper-test',
    '@test/unit/commands/new/wizard-helper-test',
    '@test/unit/commands/new/hosted-skill-helper-test',
    // command - configure
    '@test/unit/commands/configure/index-test',
    '@test/unit/commands/configure/ui-test',
    '@test/unit/commands/configure/helper-test',
    '@test/unit/commands/configure/questions-test',
    '@test/unit/commands/configure/ask-profile-setup-helper-test',
    '@test/unit/commands/configure/aws-profile-setup-helper-test',
    // command - init
    '@test/unit/commands/init/index-test',
    '@test/unit/commands/init/ui-test',
    '@test/unit/commands/init/helper-test',
    // command - dialog
    '@test/unit/commands/dialog/index-test',
    '@test/unit/commands/dialog/helper-test',
    '@test/unit/commands/dialog/replay-mode-test',
    '@test/unit/commands/dialog/interactive-mode-test',
    // command - deploy
    '@test/unit/commands/deploy/index-test',
    '@test/unit/commands/deploy/helper-test',
    // command - smapi
    '@test/unit/commands/smapi/cli-customization-processor-test.js',
    '@test/unit/commands/smapi/smapi-command-handler-test.js',
    '@test/unit/commands/smapi/smapi-commander-test.js',
    '@test/unit/commands/smapi/smapi-docs-test.js',
    '@test/unit/commands/smapi/before-send-processor-test.js',
    // command - smapi - export-package
    '@test/unit/commands/smapi/appended-commands/export-package/index-test.js',
    '@test/unit/commands/smapi/appended-commands/export-package/helper-test.js',
    // command - smapi - get-task
    '@test/unit/commands/smapi/appended-commands/get-task/index-test.js',
    // command - smapi - search-task
    '@test/unit/commands/smapi/appended-commands/search-task/index-test.js',

    // command - util
    '@test/unit/commands/util/upgrade-project/index-test',
    '@test/unit/commands/util/upgrade-project/ui-test',
    '@test/unit/commands/util/upgrade-project/helper-test',
    '@test/unit/commands/util/upgrade-project/hosted-skill-helper-test',
    // clients
    '@test/unit/clients/http-client-test',
    '@test/unit/clients/metric-client-test',
    '@test/unit/clients/smapi-client-test',
    '@test/unit/clients/git-client-test',
    '@test/unit/clients/lwa-auth-code-client-test',
    '@test/unit/clients/aws-client/abstract-aws-client-test',
    '@test/unit/clients/aws-client/s3-client-test',
    '@test/unit/clients/aws-client/cloudformation-client-test',
    '@test/unit/clients/aws-client/aws-util-test',
    '@test/unit/clients/aws-client/iam-client-test',
    '@test/unit/clients/aws-client/lambda-client-test',
    // model
    '@test/unit/model/abstract-config-file-test',
    '@test/unit/model/app-config-test',
    '@test/unit/model/dialog-save-skill-io-file-test',
    '@test/unit/model/manifest-test',
    '@test/unit/model/resources-config/resources-config-test',
    '@test/unit/model/resources-config/ask-resources-test',
    '@test/unit/model/resources-config/ask-states-test',
    '@test/unit/model/yaml-parser-test',
    '@test/unit/model/regional-stack-file-test',
    '@test/unit/model/dialog-replay-file-test',
    // controller
    '@test/unit/controller/authorization-controller/index-test',
    '@test/unit/controller/dialog-controller/index-test',
    '@test/unit/controller/dialog-controller/simulation-response-parser-test',
    '@test/unit/controller/skill-metadata-controller-test',
    '@test/unit/controller/skill-code-controller-test',
    '@test/unit/controller/skill-simulation-controller-test',
    '@test/unit/controller/code-builder-test',
    '@test/unit/controller/skill-infrastructure-controller-test',
    '@test/unit/controller/deploy-delegate-test',
    '@test/unit/controller/hosted-skill-controller/index-test',
    '@test/unit/controller/hosted-skill-controller/clone-flow-test',
    // view
    '@test/unit/view/messenger-test',
    '@test/unit/view/json-view-test',
    '@test/unit/view/spinner-view-test',
    '@test/unit/view/multi-tasks-view-test',
    '@test/unit/view/cli-repl-view-test',
    '@test/unit/view/dialog-repl-view-test',
    // utils
    '@test/unit/utils/url-utils-test',
    '@test/unit/utils/string-utils-test',
    '@test/unit/utils/zip-utils-test',
    '@test/unit/utils/hash-utils-test',
    '@test/unit/utils/retry-utility-test',
    '@test/unit/utils/provider-chain-utils-test',
    '@test/unit/utils/local-host-server-test',
].forEach((testFile) => {
    // eslint-disable-next-line global-require
    require(testFile);
});
