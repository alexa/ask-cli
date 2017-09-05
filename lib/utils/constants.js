'use strict';

module.exports.COMMAND = {

    INIT: Object.freeze({
        HELP_DESCRIPTION:   '\n  Usage: ask-init\n\n' +
                            '  $ ask init [--no-browser] [-l|--list-profiles] [-p|--profile] [--debug]\n\n' +
                            '  To establish authorization for the CLI to create and modify skills ' +
                            'associated with your Amazon developer account, you must run the init command.\n\n\n' +
                            '  Options:\n\n' +
                            '    --no-browser             display authorization url instead of opening browser\n' +
                            '    -l, --list-profiles      list all the profile(s) for ask-cli\n' +
                            '    -p, --profile <profile>  name for the profile to be created/updated\n' +
                            '    --debug                  ask cli debug mode\n' +
                            '    -h, --help               output usage information'
    }),

    DEPLOY: Object.freeze({
        HELP_DESCRIPTION:   '\n  Usage: ask-deploy\n\n' +
                            '  $ ask deploy [--no-wait] [-t|--target <target>] [-p|--profile <profile>] [--debug]\n\n' +
                            '  Deploys a skill project to your developer account, optionally deploying Lambda code. ' +
                            'For example, for a custom skill, your skill.json file, interaction model file, and AWS ' +
                            'Lambda function code files will be deployed. For a smart home skill, your skill.json file ' +
                            'and code files will be deployed. For a flash briefing skill, only the skill.json file will' +
                            ' be deployed.\n\n' +
                            '  If the skill has never been deployed, the ask-cli will create a new skill and a new ' +
                            'Lambda function. The newly created skill ID is written to the skill configuration file ' +
                            'at $HOME/.ask/config.\n\n' +
                            '  If the skill already exists, ask-cli will update the existing skill, including metadata, ' +
                            'sample utterances, and so on, as well as AWS Lambda function resources if applicable. If this ' +
                            'skill package has been created by previously downloading an existing skill using "ask clone", ' +
                            'and you perform "ask deploy" on the package for the first time, then ask-cli will prompt you to ' +
                            'ensure you want to overwrite the existing skill in your account.\n\n\n' +
                            '  Options:\n\n' +
                            '    --no-wait                asynchronous model deployment\n' +
                            '    -t, --target <target>    deploy lambda, model, skill or all of them\n' +
                            '    -p, --profile <profile>  ask cli profile\n' +
                            '    --debug                  ask cli debug mode\n' +
                            '    -h, --help               output usage information'
    }),

    CLONE: Object.freeze({
        HELP_DESCRIPTION:   '\n  Usage: ask-clone\n\n' +
                            '  $ ask clone [-s|--skill-id <skill-id>] [-p|--profile <profile>] [--debug]\n\n' +
                            '  Creates a skill project by cloning an existing skill. ' +
                            'Used to set up a new project from the latest deployed one, ' +
                            'possibly for updates or modifications.\n\n' +
                            '  Note: If there is an existing skill project directory with the same ' +
                            'name as the skill being cloned, the directory will be overwritten.\n\n\n' +
                            '  Options:\n\n' +
                            '    -s, --skill-id <skill-id>  skill-id for the skill\n' +
                            '    -p, --profile <profile>    ask cli profile\n' +
                            '    --debug                    ask cli debug mode\n' +
                            '    -h, --help                 output usage information'
    }),

    NEW: Object.freeze({
        HELP_DESCRIPTION:   '\n  Usage: ask-new\n\n' +
                            '  $ ask new [-n|--skill-name <name>] [-p|--profile <profile>] [--lambda-name <lambda-name>]\n\n' +
                            '  Creates a new skill project in the current directory. Use the new command to create the ' +
                            'directories and files necessary to deploy a skill with minimal modifications.\n\n' +
                            '  The parent directory for the skill will be named the same as the specified skill name, ' +
                            'and the parent directory will contain the other files and directories necessary to manage ' +
                            'the skill with the ask-cli. Following is an example of the directories and files created ' +
                            'for a custom skill in the en-US locale:\n\n' +
                            '  -skill-name\n' +
                            '    -.ask\n' +
                            '      -config\n' +
                            '    -lambda\n' +
                            '      -custom\n' +
                            '        -index.js\n' +
                            '    -models\n' +
                            '      -en-US.json\n' +
                            '    -skill.json\n\n\n' +
                            '  Options:\n\n' +
                            '    -n, --skill-name <name>        create new skill project with skill name\n' +
                            '    --lambda-name <lambda-name>    define lambda name if the skill needs lambda function\n' +
                            '    -p, --profile <profile>        create new skill project under the chosen profile\n' +
                            '    -h, --help                     output usage information'
    })

};
