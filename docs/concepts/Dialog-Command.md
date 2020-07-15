# DIALOG COMMAND

`ask dialog` opens an interactive mode, similar to Node's Read-Eval-Print-Loop (REPL), in which developers can simulate a multi-turn conversation with Alexa. For each utterance, Dialog command leverages [simulate-skill](https://developer.amazon.com/en-US/docs/alexa/smapi/ask-cli-command-reference.html#simulate-command) to asynchronously poll simulation result until it's available and shows Alexa text responses.

**PRE-REQUISITES:**

* Dialog command only supports Custom skill type.
* Ensure the locale you want to simulate exists in your publishingInformation in skill manifest.
* Skill must have been enabled for simulation before running the dialog command.


**STRUCTURE OF DIALOG COMMAND:**

`ask dialog [-s|--skill-id <skill-id>] [-l|--locale <locale>] [-g|--stage <stage>] [-r|--replay <file-path>] [--save-skill-io <file-path>] [-p|--profile <profile>] [--debug]`

**OPTIONS DESCRIPTION:**

**skill-id**: Optional. Represents the Id associated with the skill the user is expecting to simulate. It should be in the format `amzn1.ask.skill.12345678-1234-1234-123456789123`. If skill-id is not specified, and if the `--replay` option is not specified, this command must be run from the skill project root directory. Do not specify the skill-id if you use the --replay option.

**locale**: Optional. If ASK_DEFAULT_DEVICE_LOCALE environment variable is set, the value from the variable is  used. If ASK_DEFAULT_DEVICE_LOCALE is not set and the command is executed from the skill project root directory, the locale defaults to the first locale in the skill manifest. Otherwise, it is required.

**stage**: Optional. Indicates stage of the skill. Use development or live as values. Defaults to development.

**replay**: Optional. Specify a replay file to simulate a conversation with your skill. Specifying this option will run the command in Replay Mode.

**save-skill-io**: Optional. Specify an output file to write simulation invocation requests and responses.

**profile**: Optional. Specify a profile name to be used. Defaults to use `default` as the profile name, if this option or environmental variable `ASK_DEFAULT_PROFILE` is not set.

**debug**: Optional. Appends a debug message to the standard error.

## MODES SUPPORTED BY DIALOG COMMAND:

### INTERACTIVE MODE

This mode allows developers to simulate a multi-turn conversation with Alexa. If `skill-id` is not specified, the command must be executed in the skill project root directory. If the environment variable with key `ASK_DEFAULT_DEVICE_LOCALE` or `-l|--locale <locale>` option is not specified, then the locale defaults to the first value from the skill manifest.
Note that end of a skill session will not quit the Interactive mode. User is expected to run `.quit` sub-command to exit the Interactive mode.

User experience in Interactive mode will be,

```
============================== Welcome to ASK Dialog ===============================
=== In interactive mode, type your utterance text onto the console and hit enter ===
============= Alexa will then evaluate your input and give a response! =============

User  > open hello world
Alexa > Welcome, you can say Hello or Help. Which would you like to try?
User  > help
Alexa > You can say hello to me! How can I help?
User  > hello
Alexa > Hello World!
User  > .record <path_to_replay_file>
Created replay file at <path_to_replay_file>
User  > .quit

================================= Goodbye! =========================================

```
#### Special sub-commands:

**.record**: To record the list of utterances so far in a JSON file. User can continue to interact with the skill once the replay file has been created. This command provides user an option  `--append-quit`, which the user can append to record command, to add `.quit` to list of utterances before creation of replay file. Format: `.record <fileName>`  or `.record <fileName> --append-quit`.

**.quit**: Exits the Interactive mode.

#### Format for the Replay file:

``` javascript

{
  "skillId": "<skillId>",
  "locale": "en-US",
  "type": "text",
  "userInput": [
    "open hello world",
    "help",
    "hello"
  ]
}
```

**Note:** Do not specify `--replay` option when in Interactive mode.

### REPLAY MODE

Replay mode can be initiated by specifying `--replay` argument with an input file ([replay file created in Interactive mode](#format-for-the-replay-file)). This mode will read contents of the replay file and sequentially send each user input from Replay file to fetch corresponding responses. Once all the user inputs have been evaluated, it will switch back to Interaction mode to facilitate further interaction with Alexa skill.

User experience in Replay mode will be,

```
============================== Welcome to ASK Dialog ======================================
====== Replaying a multi turn conversation with Alexa from <path_to-replay_file> ==========
============= Alexa will then evaluate your input and give a response! ====================

User  > open hello world
Alexa > Welcome, you can say Hello or Help. Which would you like to try?
User  > help
Alexa > You can say hello to me! How can I help?
User  > hello
Alexa > Hello World!

============================== Switching to interactive dialog. ============================
= To automatically quit after replay, append '.quit' to the userInput of your replay file. =

User  >
```

**Note:** Do not specify neither `skill-id` nor `locale` in Replay mode since these will be read from replay file.
