# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0](https://github.com/alexa/ask-cli/compare/v0.13.0...v2.0.0) (2020-04-08)


### Features

* ask-cli v2.0.0 ([#105](https://github.com/alexa/ask-cli/issues/105)) ([984d37b](https://github.com/alexa/ask-cli/commit/984d37b9f7abfb651b2737a71c46accb9dd78dce)), closes [#110](https://github.com/alexa/ask-cli/issues/110)


### Bug Fixes

* improve user experiences by updating the post-lwa response webpage ([#108](https://github.com/alexa/ask-cli/issues/108)) ([41c17a6](https://github.com/alexa/ask-cli/commit/41c17a6d15b30334cbea028a99c1662ae58b53af))

## [0.13.0](https://github.com/alexa-labs/ask-cli/compare/v0.12.0...v0.13.0) (2020-04-08)


### Features

* add version reminder to high-level commands if ask-cli releases ([#104](https://github.com/alexa-labs/ask-cli/issues/104)) ([4445cfa](https://github.com/alexa-labs/ask-cli/commit/4445cfac3c94bfe7fa1ce56badcfb1ef68bcb17f))
* implemented auto generation of docs for smapi commands ([#70](https://github.com/alexa-labs/ask-cli/issues/70)) ([9b2f93e](https://github.com/alexa-labs/ask-cli/commit/9b2f93e1205b835c0d42a7bbddcae76f6a181eaf))


### Bug Fixes

* add skipUnwrap to 2 new complex body parameters ([c58453c](https://github.com/alexa-labs/ask-cli/commit/c58453ca6c1f51b67b1feba52ea154d1ec90ffa4))
* askx new -> change the representation layer for deployers ([#106](https://github.com/alexa-labs/ask-cli/issues/106)) ([0c7750c](https://github.com/alexa-labs/ask-cli/commit/0c7750c735f08ffda63559a817653276a1837afe))

## [0.12.0](https://github.com/alexa-labs/ask-cli/compare/v0.11.1...v0.12.0) (2020-04-02)


### Bug Fixes

* ashx new AHS -> fails with credential problem ([#98](https://github.com/alexa-labs/ask-cli/issues/98)) ([2da4326](https://github.com/alexa-labs/ask-cli/commit/2da43269d78ec904476207cc486d0130cffb32f3))
* askx new --template-url -> the language and deployer selection a… ([#95](https://github.com/alexa-labs/ask-cli/issues/95)) ([1907e07](https://github.com/alexa-labs/ask-cli/commit/1907e07e7f5bde3294b67a709689c75cdba17c0e))
* askx upgrade-project -> remove skill.json and other v1 artifacts ([#102](https://github.com/alexa-labs/ask-cli/issues/102)) ([936e197](https://github.com/alexa-labs/ask-cli/commit/936e197d6331c92bc156af480885206604401c5b))
* enable skill for hosted skill init ([#96](https://github.com/alexa-labs/ask-cli/issues/96)) ([8dbf91d](https://github.com/alexa-labs/ask-cli/commit/8dbf91d15ed966346a41f6cf1b84f69f236e9880))
* file permissions for .ask/cli_config and .aws/credentials ([#94](https://github.com/alexa-labs/ask-cli/issues/94)) ([d891df8](https://github.com/alexa-labs/ask-cli/commit/d891df8352424b29d6513b9975347a3b2452509f))
* provide instruction in init command and change to warn if no error from user inputs ([2b3ae49](https://github.com/alexa-labs/ask-cli/commit/2b3ae493e73ad8cf2e366707f8e2836aac913be8))
* simplify the message in new command, skip bootstrap if template is deployer-aware ([8a80e46](https://github.com/alexa-labs/ask-cli/commit/8a80e465b1bdfbed329ab932bf67a11d4fe7f6e9))
* update messaging in dialog, configure and new commands ([62d747d](https://github.com/alexa-labs/ask-cli/commit/62d747dcd6e522194deaa057b8ee4185257395db))

### [0.11.1](https://github.com/alexa-labs/ask-cli/compare/v0.11.0...v0.11.1) (2020-03-31)


### Bug Fixes

* askx init --hosted-skill-id -> fail when not include ask-resources.json in the git ([#75](https://github.com/alexa-labs/ask-cli/issues/75)) ([f0da5da](https://github.com/alexa-labs/ask-cli/commit/f0da5da5967a099bc414a72fadba9223865057d5))
* askx new -> list of selections is not static when choosing deployer ([#91](https://github.com/alexa-labs/ask-cli/issues/91)) ([5d86874](https://github.com/alexa-labs/ask-cli/commit/5d868744b19764475a736122ac6f0d78a9124b85))
* change upgrade-project command to track skill-id in ask-states.json ([#90](https://github.com/alexa-labs/ask-cli/issues/90)) ([97e986e](https://github.com/alexa-labs/ask-cli/commit/97e986e3de17b1996d7350c41f48a272d36b26f7))
* enable interaction after record and support option to append quit to replay file, continue session after .record ([#89](https://github.com/alexa-labs/ask-cli/issues/89)) ([ea8da7a](https://github.com/alexa-labs/ask-cli/commit/ea8da7ae492aa4b2e1546edc7c738d88b0246296))
* fix issue of vendor-id being required parameter ([#86](https://github.com/alexa-labs/ask-cli/issues/86)) ([183a3e1](https://github.com/alexa-labs/ask-cli/commit/183a3e16bf6d6cd2332722960deff0a6c7a4bdbe))
* show error for the smapi commands from the upstream request ([#85](https://github.com/alexa-labs/ask-cli/issues/85)) ([6fcb601](https://github.com/alexa-labs/ask-cli/commit/6fcb601d0a9cb04d3a2bba69dc224b2eb13b8762))
* update to "open" package and add warn messaging for token security ([aee5c92](https://github.com/alexa-labs/ask-cli/commit/aee5c924caf8903e70134b69a7b447e93baba60d))

## [0.11.0](https://github.com/alexa-labs/ask-cli/compare/v0.10.5...v0.11.0) (2020-03-27)


### Features

* move states data from ask-resources.json configuration to .ask/ask-states.json ([45d550e](https://github.com/alexa-labs/ask-cli/commit/45d550ecdf05f0b69ea1a9df9ae69863cf99b8d2))


### Bug Fixes

* adding -p shortcut and description for smapi default options ([#73](https://github.com/alexa-labs/ask-cli/issues/73)) ([f50184a](https://github.com/alexa-labs/ask-cli/commit/f50184a045057e3e5c2d503ff06bf75fdae78688))
* change from fatal to warn message ([#71](https://github.com/alexa-labs/ask-cli/issues/71)) ([37c922f](https://github.com/alexa-labs/ask-cli/commit/37c922f73de8431bbc341f5ee749a62f7070882b))
* fix issues when parent parameter is not camel case ([#72](https://github.com/alexa-labs/ask-cli/issues/72)) ([8ac3844](https://github.com/alexa-labs/ask-cli/commit/8ac38441178f2ca17aa20bcd12c4481adf9e488a))

### [0.10.5](https://github.com/alexa-labs/ask-cli/compare/v0.10.4...v0.10.5) (2020-03-25)


### Bug Fixes

* add the missed return before the callback when handleExistingLambda fails in upgrade command ([#67](https://github.com/alexa-labs/ask-cli/issues/67)) ([6b941af](https://github.com/alexa-labs/ask-cli/commit/6b941afe20490d2003565d0c9b68fecf62ae603e))

### [0.10.4](https://github.com/alexa-labs/ask-cli/compare/v0.10.3...v0.10.4) (2020-03-25)


### Bug Fixes

* default success message when no response body from smapi ([b7fdd59](https://github.com/alexa-labs/ask-cli/commit/b7fdd5980b179402d917f7293f60385846fda261))
* fix issue when test was switching git branch to master ([0ca3582](https://github.com/alexa-labs/ask-cli/commit/0ca3582b23db4cb9ffa6fcad766151de37ddd60e))

### [0.10.3](https://github.com/alexa-labs/ask-cli/compare/v0.10.2...v0.10.3) (2020-03-25)


### Bug Fixes

* import URL object & handle cross-platform file separator ([#65](https://github.com/alexa-labs/ask-cli/issues/65)) ([83ab50e](https://github.com/alexa-labs/ask-cli/commit/83ab50efb13a6f66be55576b4c90bf42fa233f32))

### [0.10.2](https://github.com/alexa-labs/ask-cli/compare/v0.10.1...v0.10.2) (2020-03-23)


### Features

* git-client refactoring ([394fe82](https://github.com/alexa-labs/ask-cli/commit/394fe8298c5d873ce714905432dcb42cc30114bd))
* hosted skill create  + clone ([25bac7e](https://github.com/alexa-labs/ask-cli/commit/25bac7e399d2498b090fb48e3069ff92a25d19c3))
* hosted skill deploy ([b303741](https://github.com/alexa-labs/ask-cli/commit/b3037418f18ffa36c213a4948c68c4074dc1d02f))
* hosted skill-upgrade project ([72b9ac7](https://github.com/alexa-labs/ask-cli/commit/72b9ac7e726b06cf45d7c06afb47846b338963a2))
* hosted skills initialization - git clone ([3dca627](https://github.com/alexa-labs/ask-cli/commit/3dca627fb8c982d3b8f0dcd929f8d4e87d35832f))


### Bug Fixes

* keep .git in migrated project & add git repositoryurl in ask-resources.json for hosted skill ([91a6cd9](https://github.com/alexa-labs/ask-cli/commit/91a6cd9c695ac441b78018551c275d208a2abd91))

### [0.10.1](https://github.com/alexa-labs/ask-cli/compare/v0.10.0...v0.10.1) (2020-03-23)


### Bug Fixes

* add exit code 1 for failed smapi command; take first element from ask-smapi-sdk client response; add commander handling for required options ([756b5b0](https://github.com/alexa-labs/ask-cli/commit/756b5b0fc23b300e072be61202a5e02c9fb55e76))

## [0.10.0](https://github.com/alexa-labs/ask-cli/compare/v0.9.1...v0.10.0) (2020-03-20)


### Features

* implemented smapi command ([2f81f03](https://github.com/alexa-labs/ask-cli/commit/2f81f03c97c8fe12339d9547a8cc0d37572e82bf))

### [0.9.1](https://github.com/alexa-labs/ask-cli/compare/v0.9.0...v0.9.1) (2020-03-20)


### Bug Fixes

* track "expires_at" into credentials file when getting lwa tokens ([52f1872](https://github.com/alexa-labs/ask-cli/commit/52f1872b4a8e2a41d89f9ada4c026e105b98762f))

## [0.9.0](https://github.com/alexa-labs/ask-cli/compare/v0.8.0...v0.9.0) (2020-03-19)


### Features

* port dialog command to cli v2 ([c88938c](https://github.com/alexa-labs/ask-cli/commit/c88938cc2054645162f16d0e0bc6c7085b96cd5f))


### Bug Fixes

* check environmental variable ASK_SMAPI_SERVER_BASE_URL in smapi client before default endpoint ([3710699](https://github.com/alexa-labs/ask-cli/commit/3710699031accfd45c8b5a97d60ccae6f615f452))

## [0.8.0](https://github.com/alexa-labs/ask-cli/compare/v0.7.3...v0.8.0) (2020-02-25)


### Features

* add telemetry with metric client ([e4e72e2](https://github.com/alexa-labs/ask-cli/commit/e4e72e20c33eb2dcc49668c3a8bc5e4689ceddbc))
* convert v1 init command to v2 configure command. ([8268de8](https://github.com/alexa-labs/ask-cli/commit/8268de844150dc4fa372b737362b67c797a79f8f))
* new CLI command "init" to initialize skill project ([284b933](https://github.com/alexa-labs/ask-cli/commit/284b933184ff3fe3f20e9a28af459bf1e7a8e8b5))


### Bug Fixes

* environment variables usage and profile name check in configure command ([9879b8f](https://github.com/alexa-labs/ask-cli/commit/9879b8fce7bd250aa6b19f2692d54a0f8ca49df4))
* solve the functional test failure caused by app-config ([5d3053e](https://github.com/alexa-labs/ask-cli/commit/5d3053e0a42465f52363a33fc7f450f7f2296c5c))

### [0.7.3](https://github.com/alexa-labs/ask-cli/compare/v0.7.2...v0.7.3) (2020-02-13)

### [0.7.2](https://github.com/alexa-labs/ask-cli/compare/v0.7.1...v0.7.2) (2020-02-12)


### Bug Fixes

* updated awsRegion setting logic ([e2807aa](https://github.com/alexa-labs/ask-cli/commit/e2807aa1fefc7b1de1324586431ca73562fd118d))

### [0.7.1](https://github.com/alexa-labs/ask-cli/compare/v0.7.0...v0.7.1) (2020-02-05)


### Features

* add message to check that user in root directory of the project when config file not found ([b92d864](https://github.com/alexa-labs/ask-cli/commit/b92d864422b27734e24a3a14614823d8edc830cf))

## [0.7.0](https://github.com/alexa-labs/ask-cli/compare/v0.6.1...v0.7.0) (2020-01-28)


### Features

* add "ask api get-metrics" and "ask api export-package" commands ([eb94433](https://github.com/alexa-labs/ask-cli/commit/eb94433911a9f040db6f91afef7994345601c487))
=======
### [0.6.2](https://github.com/alexa-labs/ask-cli/compare/v0.6.1...v0.6.2) (2020-02-12)


### Bug Fixes

* updated awsRegion setting logic ([07b5fa9](https://github.com/alexa-labs/ask-cli/commit/07b5fa9e17b2d4cdc4f8967d0f3bb913c4bca24c))
>>>>>>> Stashed changes

### [0.6.1](https://github.com/alexa-labs/ask-cli/compare/v0.6.0...v0.6.1) (2019-12-25)


### Bug Fixes

* upgraded nodejs from v8 to v10 & fixed validate lambda deploy state issue ([e18b1df](https://github.com/alexa-labs/ask-cli/commit/e18b1df002eca8fd7f64c3f216192e91483c14f7))

## [0.6.0](https://github.com/alexa-labs/ask-cli/compare/v0.5.0...v0.6.0) (2019-12-12)


### Features

* add two api commands "get-task" and "search-task" ([9ac1ed0](https://github.com/alexa-labs/ask-cli/commit/9ac1ed01ad1a4a654a9e1a43da40cfd5bf7b0296))

## [0.5.0](https://github.com/alexa-labs/ask-cli/compare/v0.4.1...v0.5.0) (2019-12-06)


### Features

* implement "ask util upgrade-to-v2" command to upgrade v1 project to v2 structure ([f474f2b](https://github.com/alexa-labs/ask-cli/commit/f474f2be4f13b134e66558aaa55b0a405eb21509))

### [0.4.1](https://github.com/alexa-labs/ask-cli/compare/v0.4.0...v0.4.1) (2019-12-05)

## [0.4.0](https://github.com/alexa-labs/ask-cli/compare/v0.3.0...v0.4.0) (2019-12-05)


### Features

* add lambda deployer ([808be3a](https://github.com/alexa-labs/ask-cli/commit/808be3ac7816e7637baad55ac3c98641d6b883f2))

## [0.3.0](https://github.com/alexa-labs/ask-cli/compare/v0.2.1...v0.3.0) (2019-11-06)


### Features

* improve error handlings for built-in code build flows (node-npm, python-pip and java-mvn) ([3f76185](https://github.com/alexa-labs/ask-cli/commit/3f76185d2159aceedf4863e1790ade0b1a0b66cd))

### [0.2.1](https://github.com/alexa-labs/ask-cli/compare/v0.1.0...v0.2.1) (2019-11-06)


### Features

* enable skill after deploy resources finished ([#30](https://github.com/alexa-labs/ask-cli/issues/30)) ([4665bde](https://github.com/alexa-labs/ask-cli/commit/4665bde33fa2c6f7e10dabd46257daef5d2aadba))
* enhance post skillInfrastructure deploy by comparing hash before calling updateManifest and adding polling to ensure update request completes ([10b2e63](https://github.com/alexa-labs/ask-cli/commit/10b2e63c01c0e27532b5979341c295990e58b1a2))


### Bug Fixes

* use Math.pow() to replce ** for Node v6 support in retry-utility ([1c6f372](https://github.com/alexa-labs/ask-cli/commit/1c6f372fe6d385f96f6824dfc50b69e2ec9c66f7))

## 0.2.0 (2019-11-05)


### Features

* enable skill after deploy resources finished ([#30](https://github.com/alexa-labs/ask-cli/issues/30)) ([4665bde](https://github.com/alexa-labs/ask-cli/commit/4665bde33fa2c6f7e10dabd46257daef5d2aadba))
* enhance post skillInfrastructure deploy by comparing hash before calling updateManifest and adding polling to ensure update request completes ([10b2e63](https://github.com/alexa-labs/ask-cli/commit/10b2e63c01c0e27532b5979341c295990e58b1a2))


## 0.1.0 (2019-08-26)


### Features

* release of ask-cli-x!
