# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.16.2](https://github.com/alexa/ask-cli/compare/v2.16.1...v2.16.2) (2020-10-07)


### Bug Fixes

* error in metric client when env profile is used and .ask holder exists ([fa9529a](https://github.com/alexa/ask-cli/commit/fa9529a1c93bb3908f7e20b98d52849117bd62e6))

### [2.16.1](https://github.com/alexa/ask-cli/compare/v2.16.0...v2.16.1) (2020-09-25)


### Bug Fixes

* bump ask-smapi-sdk version to include some fix to smapi commands ([5370df2](https://github.com/alexa/ask-cli/commit/5370df2cc7bd6d8db17b9557bc1490fc068dd162))

## [2.16.0](https://github.com/alexa/ask-cli/compare/v2.15.0...v2.16.0) (2020-09-18)


### Features

* add commands for dynamic update feature, add skipUnwrap for createJobDefinitionRequest ([7d53461](https://github.com/alexa/ask-cli/commit/7d534614eb553fed8edb425ddfea1fe71572f5de))


### Bug Fixes

* failure in smapiClient for createCatalogUpload method ([6e838e8](https://github.com/alexa/ask-cli/commit/6e838e8007df4a9214b37c7a7b0c59adb17b5699))
* issue with different path on windows and mac ([#298](https://github.com/alexa/ask-cli/issues/298)) ([66439e2](https://github.com/alexa/ask-cli/commit/66439e2de082c186c9bbe29c7a051fa6aa1bfeb2))
* log error on auth failure. ([#299](https://github.com/alexa/ask-cli/issues/299)) ([798fb44](https://github.com/alexa/ask-cli/commit/798fb44ce68093159358ea6cde06875c819fd8cb))
* propogate correct error message for file not found ([23aabd7](https://github.com/alexa/ask-cli/commit/23aabd7b361139603d80fc0becaa68fe88731dc4))

## [2.15.0](https://github.com/alexa/ask-cli/compare/v2.14.0...v2.15.0) (2020-08-26)


### Features

* add locale and region for AHS ([#287](https://github.com/alexa/ask-cli/issues/287)) ([6c8991c](https://github.com/alexa/ask-cli/commit/6c8991c2d171cd0783422335e4c655f136c2e038))
* add telemetry in smapi commands ([#278](https://github.com/alexa/ask-cli/issues/278)) ([54f972b](https://github.com/alexa/ask-cli/commit/54f972b185ea989c97fc667a83b320f84c2b65de))
* update ask smapi model to 1.10.1 ([4d91056](https://github.com/alexa/ask-cli/commit/4d91056ed12dddb8579b45dd57294467fda1044e))

## [2.14.0](https://github.com/alexa/ask-cli/compare/v2.13.0...v2.14.0) (2020-08-04)


### Features

* modify the default AWS region for FE to us-west-2 ([c418bea](https://github.com/alexa/ask-cli/commit/c418beab799188f26940f0c3fc809ac75d035e8e))


### Bug Fixes

* error object Object to show meaningful error message ([#275](https://github.com/alexa/ask-cli/issues/275)) ([fd4566d](https://github.com/alexa/ask-cli/commit/fd4566de98e2086f8e0dc20f989123a6fdbb7272))
* fix deploy fails when images specified as file paths in skill package ([#272](https://github.com/alexa/ask-cli/issues/272)) ([b8341f8](https://github.com/alexa/ask-cli/commit/b8341f8f540d570f89faf6832b850a5f653c7295))
* improve the description for ask-smapi command [JSON] options ([6194e84](https://github.com/alexa/ask-cli/commit/6194e8407c46c04ae1e47b87228bf55640005e0f))
* remove check for template url ending with .git ([#273](https://github.com/alexa/ask-cli/issues/273)) ([e1be6b7](https://github.com/alexa/ask-cli/commit/e1be6b7a9e1fbd31b5d06339809a9ed520f9551b))

## [2.13.0](https://github.com/alexa/ask-cli/compare/v2.12.1...v2.13.0) (2020-07-21)


### Features

* add clone locale and rollback smapi commands ([a0ce145](https://github.com/alexa/ask-cli/commit/a0ce14535f54fa5ae9a002ee77dbce74b58e6d38))
* add the scope of alexa::ask:skills:debug into LWA flow ([f8e2d0f](https://github.com/alexa/ask-cli/commit/f8e2d0f30b477ea6d0fc02532e568627a2071f9c))

### [2.12.1](https://github.com/alexa/ask-cli/compare/v2.12.0...v2.12.1) (2020-07-21)


### Bug Fixes

* add pageSize to avoid the description of the template gets too long and breaks the line ([#261](https://github.com/alexa/ask-cli/issues/261)) ([6422827](https://github.com/alexa/ask-cli/commit/64228278aea2b49374ee31d30fb008687c422842))
* default folder name to skill name for ask new command. ([#262](https://github.com/alexa/ask-cli/issues/262)) ([0e50cfe](https://github.com/alexa/ask-cli/commit/0e50cfe9d5e4d9b1d93ee6abbad113b3ff64d815))
* do not throw error exit code when the enable-skill request skipped ([#266](https://github.com/alexa/ask-cli/issues/266)) ([0a2b166](https://github.com/alexa/ask-cli/commit/0a2b1664a448d67eaa6d2dfe045bac6bc5b8db37))
* output deploy error if error not string ([#258](https://github.com/alexa/ask-cli/issues/258)) ([62c059c](https://github.com/alexa/ask-cli/commit/62c059c191bb4d08f97233782fe63008de3d8b36))

## [2.12.0](https://github.com/alexa/ask-cli/compare/v2.11.2...v2.12.0) (2020-07-15)


### Features

* add output option to dialog command ([#252](https://github.com/alexa/ask-cli/issues/252)) ([4ce263e](https://github.com/alexa/ask-cli/commit/4ce263e5c41d0fe0ea4795d8689d3ccb28bc12db))
* add target flag to deploy command ([#232](https://github.com/alexa/ask-cli/issues/232)) ([1594c24](https://github.com/alexa/ask-cli/commit/1594c244f1b255ee778384ad4230d60bb3031560))

### [2.11.2](https://github.com/alexa/ask-cli/compare/v2.11.1...v2.11.2) (2020-07-07)


### Bug Fixes

* pass profile to status hint; handle customized param names ([#250](https://github.com/alexa/ask-cli/issues/250)) ([a7e8d0d](https://github.com/alexa/ask-cli/commit/a7e8d0dd5af09f1e14d35e2e57403c316d3faabb))

### [2.11.1](https://github.com/alexa/ask-cli/compare/v2.11.0...v2.11.1) (2020-06-25)


### Bug Fixes

* ingoring version check for credential helper ([b8fd184](https://github.com/alexa/ask-cli/commit/b8fd1847c775bb540d19ce6c50517228f5e5d4c1))

## [2.11.0](https://github.com/alexa/ask-cli/compare/v2.10.2...v2.11.0) (2020-06-24)


### Features

* add default value development when stage is required ([f656de5](https://github.com/alexa/ask-cli/commit/f656de5a26e318593090755232d9ebfde526acfa))
* add support of ignore-hash in lambda deployer ([a6ea7fd](https://github.com/alexa/ask-cli/commit/a6ea7fdf0549912a626780a40dee23dc2f153cf0))
* add to show hint to check status for async smapi commands ([8d8d840](https://github.com/alexa/ask-cli/commit/8d8d84061b91d16b97294870001e785dd8a8e006))


### Bug Fixes

* add logic to create stack if old stack in delete complete status ([#224](https://github.com/alexa/ask-cli/issues/224)) ([ec32913](https://github.com/alexa/ask-cli/commit/ec32913ceb3e4468c45c7ddd1d6e8468c700cd5f))
* fix to allow dialog without providing skill id for hosted skills ([#236](https://github.com/alexa/ask-cli/issues/236)) ([13fa8db](https://github.com/alexa/ask-cli/commit/13fa8db0e043049813a7513f1730253ebe31fdb6))

### [2.10.2](https://github.com/alexa/ask-cli/compare/v2.10.1...v2.10.2) (2020-06-11)


### Bug Fixes

* add qoutes around folder path to fix issue when path has space ([#234](https://github.com/alexa/ask-cli/issues/234)) ([3c73020](https://github.com/alexa/ask-cli/commit/3c73020e3d9d3bbdd8c51e5f477186b2fe5ba7d5))

### [2.10.1](https://github.com/alexa/ask-cli/compare/v2.10.0...v2.10.1) (2020-06-05)

## [2.10.0](https://github.com/alexa/ask-cli/compare/v2.9.0...v2.10.0) (2020-06-05)


### Features

* support upgrade-project command with un-deployed project ([#223](https://github.com/alexa/ask-cli/issues/223)) ([0aea890](https://github.com/alexa/ask-cli/commit/0aea890e0a24d32fe09b63a373e3c7a355faf44f))


### Bug Fixes

* add support to run smapi command using env settings ([#216](https://github.com/alexa/ask-cli/issues/216)) ([fbb92f2](https://github.com/alexa/ask-cli/commit/fbb92f2c0a46e6d6e92c7459127ceb24ad867640))
* fix integration test ([8f11aea](https://github.com/alexa/ask-cli/commit/8f11aea634230a8eb3da689ec19dfb0b838ae265))
* read first locale from skill.json if not provided by user ([#221](https://github.com/alexa/ask-cli/issues/221)) ([8f6b031](https://github.com/alexa/ask-cli/commit/8f6b031c4c30e1bddc80b5ce1546dcf7ceff4aec))

## [2.9.0](https://github.com/alexa/ask-cli/compare/v2.8.0...v2.9.0) (2020-05-28)


### Features

* add new smapi commands for asr evaluations ([894cbc5](https://github.com/alexa/ask-cli/commit/894cbc543c20aa58f6908b97910e925630454e25))
* add support for csv content type body param in smapi ([11ccb61](https://github.com/alexa/ask-cli/commit/11ccb6100a64cbd919f572021a10b66a90e2f37c))
* support partial deploy for lambda-deployer and revisit the protocol for deployer response ([6a6f04b](https://github.com/alexa/ask-cli/commit/6a6f04b2e8684019bc83a224f00ee9646a351800))


### Bug Fixes

* add host url to apply credential helper to hosted skill repo only ([#206](https://github.com/alexa/ask-cli/issues/206)) ([3ebbc00](https://github.com/alexa/ask-cli/commit/3ebbc00bf7da11339396761ed618677d38cfa75a))
* add logic to handle non json response from smapi ([#171](https://github.com/alexa/ask-cli/issues/171)) ([aa55fc2](https://github.com/alexa/ask-cli/commit/aa55fc23c84810fa531b1743182d6426967886b5))
* address comment ([d02590d](https://github.com/alexa/ask-cli/commit/d02590dcd21c0dcf4e4b557544e6a781410ccb91))
* update the response object of create Lambda function ([a84f091](https://github.com/alexa/ask-cli/commit/a84f091de8cb08d9324ca12f8919d7f24e827cfb))

## [2.8.0](https://github.com/alexa/ask-cli/compare/v2.7.0...v2.8.0) (2020-05-20)


### Features

* add a AWS:Logs:LogGroup Resource in cfn-deployer template ([c775d0c](https://github.com/alexa/ask-cli/commit/c775d0c5b7c32dcec86cebedf0adc9e8e4544b6f))
* add full-response flag to smapi commands ([919ce9e](https://github.com/alexa/ask-cli/commit/919ce9e0a65fa7e63b179e7dd7e1d91fb7911ac1))


### Bug Fixes

* add handling for error http status code for version check ([8fd9b54](https://github.com/alexa/ask-cli/commit/8fd9b54f851b923c2ffdfce8bd7fbeee844fd9e9))
* adding qoutes to fix issue of zipping folder with spaces ([09b293e](https://github.com/alexa/ask-cli/commit/09b293e65b768de898c78b50dbb3d59c61beef01))
* smapi - improve logic to determine required for nested body params ([#202](https://github.com/alexa/ask-cli/issues/202)) ([965ba2c](https://github.com/alexa/ask-cli/commit/965ba2cb7a1058e8212fb56605b52a9d198737bf))
* update output of debug message ([f333eab](https://github.com/alexa/ask-cli/commit/f333eab55d57d73b902665d3d0378bb1d1297b4a))

## [2.7.0](https://github.com/alexa/ask-cli/compare/v2.6.0...v2.7.0) (2020-05-14)


### Features

* bump the version of ask-smapi-model to v1.8.0 ([#190](https://github.com/alexa/ask-cli/issues/190)) ([d699e04](https://github.com/alexa/ask-cli/commit/d699e04b6ac88773d7f93496d3453a8812dd9e87))


### Bug Fixes

* add ability to read with file: option for nested json params for smapi ([#182](https://github.com/alexa/ask-cli/issues/182)) ([1fbe762](https://github.com/alexa/ask-cli/commit/1fbe762cde14ab22905f6165332bc085198f4cd8))
* add the missed profile variable into the runtimeProfile method ([#188](https://github.com/alexa/ask-cli/issues/188)) ([c38f41f](https://github.com/alexa/ask-cli/commit/c38f41fe147ae43734fdac86b62c28b462353fa9))
* allow ask init with only skillMetadata and fix NPEs during the flow ([c9f89cd](https://github.com/alexa/ask-cli/commit/c9f89cdc5d24aa0a7af69842fc56292d942b8155))
* correct the decision of a required field in smapi command generation ([#184](https://github.com/alexa/ask-cli/issues/184)) ([b047b2c](https://github.com/alexa/ask-cli/commit/b047b2c943e71d4330c822af734d2ed432407e69))
* improve error message when skip unwrap is required for body parameter ([34d7db8](https://github.com/alexa/ask-cli/commit/34d7db871eef050a1b3b3f75c0a7a6404d04dfb5))
* show full context if error happens, and don't fail smapi-sdk's error response ([e1580e4](https://github.com/alexa/ask-cli/commit/e1580e457a99483b909d68b2f67f733d0bd5675c))

## [2.6.0](https://github.com/alexa/ask-cli/compare/v2.5.1...v2.6.0) (2020-05-07)


### Features

* add annotation sets and evaluations commands ([#170](https://github.com/alexa/ask-cli/issues/170)) ([f00e630](https://github.com/alexa/ask-cli/commit/f00e6308f463f7ce551b37a4c7b810e1ad889e75))

### [2.5.1](https://github.com/alexa/ask-cli/compare/v2.5.0...v2.5.1) (2020-05-06)


### Bug Fixes

* fix to respect ask env variables for commands ([#167](https://github.com/alexa/ask-cli/issues/167)) ([d63c955](https://github.com/alexa/ask-cli/commit/d63c95503add871bc611b25d18d1bd59f27710ce))

## [2.5.0](https://github.com/alexa/ask-cli/compare/v2.4.0...v2.5.0) (2020-05-06)


### Features

* add ignore-hash flag to deploy command ([#163](https://github.com/alexa/ask-cli/issues/163)) ([057860e](https://github.com/alexa/ask-cli/commit/057860ec28209358d22d0cbdec6da5e21678dfd4))


### Bug Fixes

* add error handling when refresh lwa token fails, pass in debug flag to all the authorizationController ([#165](https://github.com/alexa/ask-cli/issues/165)) ([87c8350](https://github.com/alexa/ask-cli/commit/87c8350555dc427a60ba7335ec22fe96deee58ee))

## [2.4.0](https://github.com/alexa/ask-cli/compare/v2.3.0...v2.4.0) (2020-05-04)


### Features

* add ASK_SKIP_NEW_VERSION_REMINDER to enable skipping version check at the beginning of each command ([#160](https://github.com/alexa/ask-cli/issues/160)) ([59544e3](https://github.com/alexa/ask-cli/commit/59544e359ae6692715e56a5c6dfc955f83af88b4))
* add support for template-branch parameter in new command ([#155](https://github.com/alexa/ask-cli/issues/155)) ([426edfb](https://github.com/alexa/ask-cli/commit/426edfb52f2789ea22187633922870994d3aa178))


### Bug Fixes

* added logic to handle non alphanumeric characters in smapi swagg… ([#159](https://github.com/alexa/ask-cli/issues/159)) ([768d56f](https://github.com/alexa/ask-cli/commit/768d56f54ebcf0c0e965b630e35de06d0e25f1a4))

## [2.3.0](https://github.com/alexa/ask-cli/compare/v2.2.0...v2.3.0) (2020-05-01)


### Features

* add get and search task smapi commands ([fb881d6](https://github.com/alexa/ask-cli/commit/fb881d69506f17e2a0a314c29999c07edc394b5d))


### Bug Fixes

* standardize keys for smapi auto gen logic to prevent mismatch due to case discrepancies ([069b219](https://github.com/alexa/ask-cli/commit/069b2196984e17c9caf91dd9718fd7ea814c147e))

## [2.2.0](https://github.com/alexa/ask-cli/compare/v2.1.1...v2.2.0) (2020-04-29)


### Features

* add option to read json from file path ([#151](https://github.com/alexa/ask-cli/issues/151)) ([b8e001e](https://github.com/alexa/ask-cli/commit/b8e001eeb7f21f155ddc041d9bb89ebf1c6f2afc))
* support custom smapi and lwa endpoint based on env variables ([45dbdf2](https://github.com/alexa/ask-cli/commit/45dbdf2fff37d1e5441fa3c12d1f0c0b79c28ca7))


### Bug Fixes

* add additional debug output to smapi commands ([#149](https://github.com/alexa/ask-cli/issues/149)) ([30b63ea](https://github.com/alexa/ask-cli/commit/30b63eaca77f21d9739901ae4330d1398f945ed4))
* add missing subscriptions lwa scope ([49ccf5c](https://github.com/alexa/ask-cli/commit/49ccf5cc6767921a4250541151346926dddc85d2))
* change implementation of before send logic to handle more cases ([#135](https://github.com/alexa/ask-cli/issues/135)) ([8fa9e76](https://github.com/alexa/ask-cli/commit/8fa9e767597cae5e4ef12b82c49f113bab4c8faf))
* fix when array property was displayed as json property ([c9e16ac](https://github.com/alexa/ask-cli/commit/c9e16ac7b88d5b49ee1ec85d55a4f1df5845f40c))
* unable to deploy new project with custom template by lambda deployer ([#148](https://github.com/alexa/ask-cli/issues/148)) ([2a00ff6](https://github.com/alexa/ask-cli/commit/2a00ff68da80d813eb4a3bf15ee01fdf676dbba2))

### [2.1.1](https://github.com/alexa/ask-cli/compare/v2.1.0...v2.1.1) (2020-04-17)


### Bug Fixes

* treat unrecognized command separately from command.handle method ([#130](https://github.com/alexa/ask-cli/issues/130)) ([3e2698a](https://github.com/alexa/ask-cli/commit/3e2698a626f6607c818d697d9ce987823462576c))
* update parameters description and smapi command description ([db65526](https://github.com/alexa/ask-cli/commit/db65526e6e66ec8e6d4372ed0a0969f0c0afda29))

## [2.1.0](https://github.com/alexa/ask-cli/compare/v2.0.1...v2.1.0) (2020-04-16)


### Features

* add new ask util command "generate-lwa-tokens" ([d74332f](https://github.com/alexa/ask-cli/commit/d74332f9ef9a5e276badd2ef0d0b7e4e5c2969a0))


### Bug Fixes

* add logic to handle the param which isArray and isJson for smapi commands ([ebbc2fe](https://github.com/alexa/ask-cli/commit/ebbc2fe76e934dbef10456b9ce781cd6f5c27058))
* creating a new self-hosted skill fails with TypeError ([#121](https://github.com/alexa/ask-cli/issues/121)) ([b1560dc](https://github.com/alexa/ask-cli/commit/b1560dc04c1df5d2c83d89576f3bd4d5401dc29d))
* lock package version with ask-smapi-model's version ([56bdb16](https://github.com/alexa/ask-cli/commit/56bdb165ce090b1200b93824cc7feb8347c26f6f))
* parse to correct data type for nested body parameter ([#122](https://github.com/alexa/ask-cli/issues/122)) ([6998837](https://github.com/alexa/ask-cli/commit/6998837c0d8a7595e490b24f5375fae07204f408))
* rename smapi commands version parameter since it was conflicting with global version parameter ([#125](https://github.com/alexa/ask-cli/issues/125)) ([11f808a](https://github.com/alexa/ask-cli/commit/11f808a89e50aaf8cb25655b1d360b5da1a0eb1c))
* update python-pip build-flow's build powershell script ([efa62b2](https://github.com/alexa/ask-cli/commit/efa62b206f87756e500bf7aee6f40ef44529e85f))

### [2.0.1](https://github.com/alexa/ask-cli/compare/v0.13.0...v2.0.1) (2020-04-10)


### Features

* ask-cli v2.0.0 ([#105](https://github.com/alexa/ask-cli/issues/105)) ([984d37b](https://github.com/alexa/ask-cli/commit/984d37b9f7abfb651b2737a71c46accb9dd78dce)), closes [#110](https://github.com/alexa/ask-cli/issues/110)


### Bug Fixes

* improve user experiences by updating the post-lwa response webpage ([#108](https://github.com/alexa/ask-cli/issues/108)) ([41c17a6](https://github.com/alexa/ask-cli/commit/41c17a6d15b30334cbea028a99c1662ae58b53af))
* parse order of parameters from function source code ([#112](https://github.com/alexa/ask-cli/issues/112)) ([7859681](https://github.com/alexa/ask-cli/commit/7859681fdabb27c6eea8edff52e34788c8bc303a))

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
