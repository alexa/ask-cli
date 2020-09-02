# Contributing Guidelines

## Steps to contribute
Below are typical steps to follow if you want to contribute:

1. Fork the repository
2. Clone your fork repo
```
git clone git@github.com:<your-account>/ask-cli.git
```
3. Run `npm install` at the root of the repo
4. Run `npm test` to verify that the tests are passing
5. Make your code change(s)
3. Run `npm test` to verify that the tests are still passing. If you added a new functionality, add tests to ensure that we have adequate test coverage.
You can check test coverage by running `npm run test:report` 
4. Commit your work. Your commit message should follow [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/). We have a pre commit hook to validate the commit message.
5. Send us a pull request, answering any default questions in the pull request interface. The pull request should be going to `develop` branch.
6. Pay attention to any automated CI failures reported in the pull request, and stay involved in the conversation.


## Branch Organization
We follow a simplified version of the Git Flow methodology. All new feature requests/bug fixes should be going to the `develop` branch. We merge the `develop` to `master` branch when we do a release. `master` is always a mirror of the latest version on [npm](https://www.npmjs.com/package/ask-cli).

## Semantic Versioning
We follow semantic versioning. Currently, we are not considering pull requests with breaking changes that would require major version bump. You are welcomed to open Github issues with ideas that require breaking change and we will prioritize it for the next major version release.

## Contribution Prerequisites
 - Node.js 8.3.0+
 - Git
 - IDE of your choice.

 ## IDE Set Up - VS Code
 You are welcome to use an IDE of your choice. If you choose to use VS Code, below are examples of various debug configurations for VS Code.

`.vscode/launch.json`
 ```
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "UNIT TESTS",
            "program": "${workspaceFolder}/node_modules/mocha/bin/_mocha",
            "args": [
                "-u",
                "tdd",
                "--timeout",
                "999999",
                "--colors",
                "${workspaceFolder}/test/unit/run-test.js"
            ],
            "internalConsoleOptions": "openOnSessionStart"
        },
        {
            "type": "node",
            "request": "launch",
            "name": "DEPLOY COMMAND",
            "program": "${workspaceFolder}/bin/ask.js",
            "cwd": "${env:HOME}/my-project-dir",
            "args": ["deploy"],
            "console": "integratedTerminal"
        },
        {
            "type": "node",
            "request": "launch",
            "name": "SMAPI COMMAND",
            "program": "${workspaceFolder}/bin/ask-smapi.js",
            "args": ["list-skills-for-vendor"],
            "console": "integratedTerminal"
        }
    ]
}
 ```

## Code of Conduct
This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct). 
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact 
opensource-codeofconduct@amazon.com with any additional questions or comments.
