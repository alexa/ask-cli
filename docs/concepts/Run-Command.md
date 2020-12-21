# RUN COMMAND

`ask run` allows developers to start a local instance of their skill code project as the skill endpoint.
Automatically re-routes development requests and responses between the Alexa service and your local instance.

## PRE-REQUISITES

1. The command relies on the ask-sdk-local-debug package to be installed in your skill code package.
    Instructions for installing the dependency per SDK
    * [Java](https://github.com/alexa/alexa-skills-kit-sdk-for-java/blob/2.0.x/ask-sdk-local-debug/README.md)
    * [Nodejs](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs/blob/2.0.x/ask-sdk-local-debug/README.md)
    * [Python](https://github.com/alexa/alexa-skills-kit-sdk-for-python/blob/master/ask-sdk-local-debug/README.rst)
2. The command needs to be run from within the skill package. We rely on the ask-resources and ask-states file for information on starting the local debugging session.
3. The command only supports skills in the development stage only.
4. Please make sure you have deployed the skill once to make sure skill-id exists.

**STRUCTURE OF RUN COMMAND:**

`ask run [--debug-port <debug-port>]
         [--wait-for-attach]
         [--watch]
         [--region <region>]
         [-p | --profile <profile>]
         [--debug]
         [-h | --help]` 

**OPTIONS DESCRIPTION:**

**debug-port**: Optional. Port at which the debugging process will run.

**wait-for-attach**: Optional. Waits for debugging inspector to attach. The default port for the process is 5000.

**watch**: Optional. Uses nodemon to monitor changes and automatically restart the run session.

**region**: Optional. Sets the run region for the session. Accepted values are - [EU, FE, NA]. Defaults to NA. To know more about which
                             region is right for you refer -
                             https://developer.amazon.com/en-US/docs/alexa/ask-toolkit/vs-code-testing-simulator.html#prepare

**profile**: Optional. Specify a profile name to be used. Defaults to use `default` as the profile name, if this option or environmental variable `ASK_DEFAULT_PROFILE` is not set.

**debug**: Optional. Show debug messages.


## MODES SUPPORTED BY RUN COMMAND

1. **Run Mode**: In this mode you can simply run the command - `ask run` and this will kick start the process that converts your workspace into your skill's endpoint.

<p align="center">
  <img align="center" src="https://ask-cli-static-content.s3-us-west-2.amazonaws.com/document-assets/v2-ask-run-runMode.gif?" height="300" />
</p>

2. **Debug Mode**: In this mode you can attach a debugging inspector of your favorite IDE on to the specified debug port and start leveraging your IDEs powerful debugging experience.
                   To use this mode, simply run `ask run --wait-for-attach` and the process will wait for an inspector to be attached on the default debug port - 5000. You can also 
                   change the debugging port by using the switch `--debug-port`.
                   
<p align="center">
  <img align="center" src="https://ask-cli-static-content.s3-us-west-2.amazonaws.com/document-assets/v2-ask-run-debugMode.gif" height="300" />
</p>

3. **File watcher Mode**: In this mode, you can activate the nodemon file watcher. As you make changes to the skill code, nodemon will restart the process. To use this, just add the switch 
                          `--watch` to your run command like so - `ask run --watch`. The file watcher feature can be coupled with both run and debug modes.
                          
 Vscode resources for debugging on a port
  * [Java](https://github.com/microsoft/vscode-java-debug#use)
  * [Nodejs](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_setting-up-an-attach-configuration)
  * [Python](https://code.visualstudio.com/docs/python/debugging#_command-line-debugging)

<p align="center">
  <img align="center" src="https://ask-cli-static-content.s3-us-west-2.amazonaws.com/document-assets/v2-ask-run-watchMode.gif?" height="300" />
</p>

