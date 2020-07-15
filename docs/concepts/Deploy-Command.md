# Deploy Command

`ask deploy` deploys all the Alexa skill project resources by following the settings from the project config file (i.e. ask-resources.json). It will deploy each [resource component](./Alexa-Skill-Project-Definition.md) from the local file(s) to the target endpoint sequentially. The deploy flow for each component has been optimized to be executed only when new changes exist in the local (see [usage of lastDeployHash](#track-lastdeployhash)). Users of deploy command can focus more on the content within each component, and only control the deployment when it's necessary.

This document focuses on explaining the deploy command in details for each type of resource that CLI deploys. If you are looking for references of the ask-resources config file, please check [here](./Alexa-Skill-Project-Definition.md).

**Structure of Deploy command:**

`ask deploy [--ignore-hash] [-t|--target <target>] [-p|--profile <profile>] [--debug]`

**Options Description:**

**ignore-hash**: Optional. Forces ASK CLI deploy skill package even if the hash of current skill package folder does not change.

**target**: Optional. Specify which skill project resource to deploy. Available options: skill-metadata,skill-infrastructure. 

**profile**: Optional. Specify a profile name to be used. Defaults to use `default` as the profile name, if this option or environmental variable `ASK_DEFAULT_PROFILE` is not set.

**debug**: Optional. Appends a debug message to the standard error.

## Skill Metadata
CLI relies on the [Skill Package service](https://developer.amazon.com/en-US/docs/alexa/smapi/skill-package-api-reference.html) to deploy the skill metadata component. To control the deployment of skillMetadata:

* Set the `skillMetadata.src` field with the source path to skill package, which is compliant with the [required format](https://developer.amazon.com/en-US/docs/alexa/smapi/skill-package-api-reference.html#skill-package-format). Whenever CLI deploys skillMetadata, the source folder will be uploaded to SMAPI by a skillPackage's import request.

* The deploy of skillMetadata always happens, as it contains necessary Alexa skill JSON files. However, it is still skippable with the usage of `skillMetadata.lasDeployHash`, and users will be prompted if this happens. Please see [usage of lastDeployHash](#track-lastdeployhash) for more details.

* This step might take about one minute or more to finish, because the deployment possibly includes the training and building process of language's InteractionModel and it takes time.

## Skill Code
In the deploy process of skillCode, CLI helps skill developers build all of their codebases. The built result will be used to host the skill endpoint afterwards.

* Codebase settings are always region-specific. Available regions are consistent with the regions that Alexa supports (currently `NA`, `EU`, `FE`), plus a `default` region that must be provided before other regions. If you set the `code.{region}.src` path for a certain region, CLI will update the skill's endpoint (by updating the "apis" field in skill.json) through the SMAPI's update-manifest request once the endpoint is provisioned.
* Multiple regions mapping to one codebase is recommended, as we encourage you to handle Internationalization through code.
* The `build` folder, which contains the built result, is stored inside each codebase's source path after build succeeds.
* This step is skippable when you remove the entire `code` field from ask-resources config file. However, it's required for the deployment of next component `skillInfrastructure`.

### Code Builder
To support the building of multiple programming languages, CLI's philosophy is to provide a **built-in or customized** build-flows (*i.e. {programmingLanguage}-{builderTool}*) to fullfill normal needs as well as special requests. This is called `CodeBuilder` in CLI.

* Most use cases will be covered by using the **built-in** build-flows. When building skillCode with this flow, CLI will infer the builderTool (based on the type of builder's config file) from the codebase, and further decide which build-flow to execute. Build-flows are represented by cross-OS executable scripts. Current built-in build-flows include:
  * nodejs-npm [(scripts)](https://github.com/alexa/ask-cli/tree/master/lib/builtins/build-flows/nodejs-npm)
  * python-pip [(scripts)](https://github.com/alexa/ask-cli/tree/master/lib/builtins/build-flows/python-pip)
  * java-mvn [(scripts)](https://github.com/alexa/ask-cli/tree/master/lib/builtins/build-flows/java-mvn)
* For developers who have further desire to **customize** the build-flow by themselves, CLI also supports the `custom` type of build-flow. If you provide the hook script in the following location, the script will be executed instead of using the built-in build-flows, and it is codebase-agnostic:
  * Non-Windows path: `{projectRoot}/hooks/build.sh` file
  * Windows path: `{projectRoot}\hooks\build.ps1` file
* Each build flow (either built-in or customized) is executed with two parameters: the path to the build file and if it is verbose and need debug information.


## Skill Infrastructure
To provision the backend services which are used to execute customized logics for Alexa skills, CLI introduces the `skillInfrastructure` concept to incorporate different deploy mechanisms into one platform. Each deployment flow is presented as a type of deployer, which is the value set in `skillInfrastructure.type`. Another two fields, `skillInfrastructure.userConfig` is designed to configure the deployment, and `skillInfrastructure.deployState` is used to facilitate CD and is not supposed to be modified manually.

* CLI's core logic manages the cross-region deployments. CLI deploys the skill infrastructures in parallel with spinners to indicate if the task is in progress, and with a progress bar to display the latest status.
* CLI makes sure the result after the invocation of deployer (e.g newly created AWS Lambda ARN) will get updated in the Alexa skill for each region.
* If failure happens in one region, CLI won't rollback the changes. Please try with a further deploy which contains the fix to the failure.
* This step is skippable when you remove the entire `skillInfrastructure` field from ask-resources config file.

### Deployer
Deployer is the module that serve for any unique serverless deploy mechanism. Deployer can be triggered in two scenarios, which are also the interfaces a deployer has to be implemented:

* bootstrap: Bootstrap is the step to provide any necessary preparation before calling **invoke**. It'll be called when the first time a deployer is selected. `skillInfrastructure.userConfig` is supposed to be filled with this step, and also provide developers a chance to confirm `skillInfrastructure.userConfig` before deploy. Please check [this](https://github.com/alexa/ask-cli/blob/master/lib/controllers/skill-infrastructure-controller/deploy-delegate.js#L22) for details about how to configure of a bootstrap call.
  * You can setup region-specific user config by setting the `skillInfrastructure.userConfig.regionalOverrides.{region}` field. CLI will use this field as the userConfig for the specified Alexa region.
* invoke: Invoke is the step to make the real requests to create or update the skill infrastructure. The core deployment logic for each deployer resides here. Please check [this](https://github.com/alexa/ask-cli/blob/master/lib/controllers/skill-infrastructure-controller/deploy-delegate.js#L29) for details about how to configure of a invoke call.

---

Below are the built-in deployers that CLI provides to help developers deploy their customized logic to the AWS services:

#### @ask-cli/lambda-deployer
This deployer is managing Lambda services by using the default settings to create/retrieve the IAM Role for the skill application, create/update the Lambda function with minimum required permissions and event trigger. Below shows the details of what this deployer does:

* bootstrap
  1. Resolve CLI's default AWS region by following the AWS definition for the [default region provider chain](https://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/java-dg-region-selection.html#automatically-determine-the-aws-region-from-the-environment). Also update this AWS default region into the `skillInfrastructure.userConfig`.
* invoke
  1. Validate the state in the front to make sure current deployState is valid. This check includes if IAM Role matches the Lambda ARN, and if revisionId and lastModified are tracked correctly.
  2. Deploy IAM Role. If IAM Role ARN is not present, create a default IAM Role with [basic Lambda role](https://github.com/alexa/ask-cli/blob/master/lib/utils/constants.js#L142). Else verify if the IAM Role ARN is a valid one.
  3. Deploy Lambda function.
     * If Lambda ARN is not present, the deployer will create the Lambda function by adding the event trigger.
     * If Lambda ARN is present, the deloyer will update the Lambda function's code and configuration.

#### @ask-cli/cfn-deployer
This deployer is implementing the idea of **Code as Infra** by using AWS CloudFormation. By using the CloudFormation template as the recipe, skill applications with similar infrastructure settings can simply share or extend existing template files. CloudFormation service also manages auto-rollback when a failure happens. Below shows the details of what this deployer does:

* bootstrap
  1. Resolve CLI's default AWS region by following the AWS definition for the [default region provider chain](https://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/java-dg-region-selection.html#automatically-determine-the-aws-region-from-the-environment). Update this AWS default region into the `skillInfrastructure.userConfig`.
  2. Download the default AWS CloudFormation template if no template file found. The default template creates invokable AWS Lambda function with very barebone services.
* invoke
  1. Validate the state in front to make sure all the necessary information has been collected.
  2. Upload artifacts to S3 which is the code for Lambda function. The S3 bucket is version-enabled, so the version change is the main trigger that update the CloudFormation stack.
     * The S3 bucket is created in each AWS region where the stack gets deployed. This is because Lambda requires the code artifacts to exist in the same region. Here is the [bucket naming convention](https://github.com/alexa/ask-cli/blob/542ff381a349fe4e96bb94d5f194162b0be0d005/lib/clients/aws-client/s3-client.js#L262-L268).
     * If the `lastDeployHash` doesn't change for the source skillCode, the deployer will not upload the code to S3, and thus no new version will be created.
  3. Based on the presense of stackId, the deployer will create/update AWS CloudFormation stack for each region. The creation of a stack usually takes some time as new infrastructures are being provisioned; while the update of a stack resource is much faster as the update is executed based on the changeset. Please read more about the [CloudFormation update](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-update-behaviors.html).
  4. Polling stack status and real-time display the latest event message. Provide detailed resource-level reason message if any deployment of resource fails.

## Other Concepts

### Track lastDeployHash
CLI helps developers avoid unnecessary deployment by introducing the `lastDeployHash`, which stores the hash of the src folder for each project resource (i.e. skillMetadata src, regional skillCode src). The hash will be calculated and stored in ask-resources config, only when the src is deployed successfully. And during the deploy process, CLI will calculate the hash for current src folder, and compare it with the `lastDeployHash` to decide if the resource changes and if a deploy is needed.
