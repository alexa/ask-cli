# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
