import {expect} from "chai";
import sinon from "sinon";
import path from "path";
import * as httpClient from "../../../lib/clients/http-client";
import {AbstractCommand} from "../../../lib/commands/abstract-command";
import AppConfig from "../../../lib/model/app-config";
import CONSTANTS from "../../../lib/utils/constants";
import Messenger from "../../../lib/view/messenger";
import packageJson from "../../../package.json";
import {OptionModel} from "../../../lib/commands/option-validator";
import { Command } from "commander";

const commander = new Command();

describe("Command test - AbstractCommand class", () => {
  const TEST_DO_DEBUG_FALSE = false;
  const TEST_HTTP_ERROR = "http error";
  const TEST_PROFILE = "profile";
  const TEST_NPM_REGISTRY_DATA = (inputVersion: string) => {
    const result = {
      body: {version: inputVersion},
    };
    return result;
  };
  const FIXTURE_PATH = path.join(process.cwd(), "test", "unit", "fixture", "model");
  const APP_CONFIG_NO_PROFILES_PATH = path.join(FIXTURE_PATH, "app-config-no-profiles.json");

  describe("# Command class constructor", () => {
    const mockOptionModel = {
      "foo-option": {
        name: "foo-option",
        description: "foo option",
        alias: "f",
        stringInput: "REQUIRED",
      },
      "bar-option": {
        name: "bar-option",
        description: "bar option",
        alias: "b",
        stringInput: "REQUIRED",
      },
      "another-bar-option": {
        name: "another-bar-option",
        description: "another bar option",
        alias: "a",
        stringInput: "OPTIONAL",
      },
      "baz-option": {
        name: "baz-option",
        description: "baz option",
        alias: "z",
        stringInput: "NONE",
      },
    };

    let mockProcessExit: sinon.SinonStub;
    let mockConsoleError: sinon.SinonStub;

    beforeEach(() => {
      sinon.stub(AppConfig.prototype, "read");
      sinon.stub(path, "join").returns(APP_CONFIG_NO_PROFILES_PATH);
      mockProcessExit = sinon.stub(process, "exit");
      mockConsoleError = sinon.stub(console, "error");
      sinon.stub(AbstractCommand.prototype, "_remindsIfNewVersion").resolves();
    });

    it("| should be able to register command", async () => {
      const handleStub = sinon.stub().resolves();
      class MockCommand extends AbstractCommand {
        constructor(optionModel: OptionModel) {
          super(optionModel);
        }

        name() {
          return "foo";
        }

        description() {
          return "foo description";
        }

        requiredOptions() {
          return ["foo-option"];
        }

        optionalOptions() {
          return ["bar-option", "another-bar-option", "baz-option"];
        }

        handle(options: Record<string, any>) {
          return handleStub(options);
        }
      }

      const mockCommand = new MockCommand(mockOptionModel);

      mockCommand.createCommand()(commander);
      await commander.parseAsync(["blah", "mock", "foo", "-f", "foo", "-b", "bar", "-a", "-z"]);

      expect(handleStub).calledOnce;
      const options = handleStub.getCall(0).args[0];
      expect(options._name).eq("foo");
      expect(options._description).eq("foo description");
      expect(options.fooOption).eq("foo");
      expect(options.barOption).eq("bar");
      expect(options.anotherBarOption).eq(true);
      expect(options.bazOption).eq(true);
    });

    it("| should be able to register command without any option", async () => {
      const handleStub = sinon.stub().resolves();

      class NoOptionCommand extends AbstractCommand {
        constructor(optionModel: OptionModel) {
          super(optionModel);
        }

        name() {
          return "empty-option";
        }

        description() {
          return "empty-option description";
        }

        handle(options: Record<string, any>) {
          return handleStub(options);
        }

        requiredOptions(): string[] {
          return [];
        }
        optionalOptions(): string[] {
          return [];
        }
      }

      const mockCommand = new NoOptionCommand(mockOptionModel);

      mockCommand.createCommand()(commander);
      await commander.parseAsync(["blah", "mock", "empty-option"]);

      expect(handleStub).calledWithMatch(
        sinon.match({
          _name: "empty-option",
          _description: "empty-option description",
          options: [],
        }),
      );
    });

    it("| should throw an error when no option model is found given option name", (done) => {
      class MockCommand extends AbstractCommand {
        constructor() {
          super(null as any);
        }

        name() {
          return "mockCommandWithNoOptionModel";
        }

        description() {
          return "foo description";
        }

        requiredOptions() {
          return ["foo-option"];
        }

        optionalOptions() {
          return ["bar-option", "another-bar-option", "baz-option"];
        }

        handle() {
          return Promise.resolve();
        }
      }

      mockProcessExit.callsFake(() => {
        expect(mockConsoleError.args[0][0]).include("[Fatal]: Unrecognized option ID: foo-option");
        done();
      });

      new MockCommand().createCommand()(commander);
      commander.parseAsync(["node", "mock", "mockCommandWithNoOptionModel"]);
    });

    it("| should throw an error when option validation fails", (done) => {
      class MockCommand extends AbstractCommand {
        constructor(optionModel: OptionModel) {
          super(optionModel);
        }

        name() {
          return "mockCommand";
        }

        description() {
          return "foo description";
        }

        requiredOptions() {
          return ["foo-option"];
        }

        optionalOptions() {
          return ["bar-option", "another-bar-option", "baz-option"];
        }

        handle() {
          return Promise.resolve();
        }
      }

      mockProcessExit.callsFake(() => {
        expect(mockConsoleError.args[0][0]).include(
          "[Error]: Please provide valid input for option: foo-option. Field is required and must be set.",
        );
        done();
      });

      new MockCommand(mockOptionModel).createCommand()(commander);
      commander.parseAsync(["node", "mock", "mockCommand"]);
    });

    afterEach(() => {
      sinon.restore();
      AppConfig.dispose();
    });
  });

  describe("# Static method - buildOptionString", () => {
    it("| should be able to build option string from option model", () => {
      const mockModel = {
        name: "mock-option",
        alias: "m",
        description: "mock option",
        stringInput: "REQUIRED",
      };

      const optionString = AbstractCommand.buildOptionString(mockModel);

      expect(optionString).eq("-m, --mock-option <mock-option>");

      const mockModelWithOptionalStringInput = {
        name: "mock-option",
        alias: "m",
        description: "mock option",
        stringInput: "OPTIONAL",
      };

      const optionStringWithOptionalStringInput = AbstractCommand.buildOptionString(mockModelWithOptionalStringInput);
      expect(optionStringWithOptionalStringInput).eq("-m, --mock-option [mock-option]");
    });

    it("| should omit the option value when it does not required string input", () => {
      const mockModel = {
        name: "mock-option",
        alias: "m",
        description: "mock option",
      };

      const optionString = AbstractCommand.buildOptionString(mockModel as any);

      expect(optionString).eq("-m, --mock-option");
    });

    it("| should omit the alias when there is not one", () => {
      const mockModel = {
        name: "mock-option",
        description: "mock option",
      };

      const optionString = AbstractCommand.buildOptionString(mockModel as any);

      expect(optionString).eq("--mock-option");
    });
  });

  describe("# Static method - parseOptionKey", () => {
    it("| should be able to parse option name", () => {
      expect(AbstractCommand.parseOptionKey("skill-id")).eq("skillId");
      expect(AbstractCommand.parseOptionKey("skill")).eq("skill");
    });
  });

  describe("# verify new version reminder method", () => {
    const currentMajor = parseInt(packageJson.version.split(".")[0], 10);
    const currentMinor = parseInt(packageJson.version.split(".")[1], 10);
    let errorStub: sinon.SinonStub, warnStub: sinon.SinonStub, infoStub: sinon.SinonStub, httpClientStub: sinon.SinonStub;

    beforeEach(() => {
      errorStub = sinon.stub();
      warnStub = sinon.stub();
      infoStub = sinon.stub();
      sinon.stub(Messenger, "getInstance").returns({
        info: infoStub,
        warn: warnStub,
        error: errorStub,
      });
      httpClientStub = sinon.stub(httpClient, "request");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("| skip is set, should skip version check", async () => {
      // setup
      const skip = true;
      // call
      await AbstractCommand.prototype._remindsIfNewVersion(TEST_DO_DEBUG_FALSE, skip);

      // verify
      expect(httpClientStub).not.called;
    });

    it("| http client request error, should warn it out and pass the process", async () => {
      // setup
      httpClientStub.callsArgWith(3, TEST_HTTP_ERROR);
      // call
      await AbstractCommand.prototype._remindsIfNewVersion(TEST_DO_DEBUG_FALSE, undefined);

      // verify
      expect(httpClientStub.args[0][0].url).equal(`${CONSTANTS.NPM_REGISTRY_URL_BASE}/${CONSTANTS.APPLICATION_NAME}/latest`);
      expect(httpClientStub.args[0][0].method).equal(CONSTANTS.HTTP_REQUEST.VERB.GET);
      expect(errorStub.args[0][0]).equal(
        `Failed to get the latest version for ${CONSTANTS.APPLICATION_NAME} from NPM registry.\n${TEST_HTTP_ERROR}\n`,
      );
    });

    it("| http client request error status code , should warn it out and pass the process", async () => {
      // setup
      httpClientStub.callsArgWith(3, {statusCode: 400});
      // call
      await AbstractCommand.prototype._remindsIfNewVersion(TEST_DO_DEBUG_FALSE, undefined);
      // verify
      expect(httpClientStub.args[0][0].url).equal(`${CONSTANTS.NPM_REGISTRY_URL_BASE}/${CONSTANTS.APPLICATION_NAME}/latest`);
      expect(httpClientStub.args[0][0].method).equal(CONSTANTS.HTTP_REQUEST.VERB.GET);
      expect(errorStub.args[0][0]).equal(
        `Failed to get the latest version for ${CONSTANTS.APPLICATION_NAME} from NPM registry.\nHttp Status Code: 400.\n`,
      );
    });

    it("| new major version released, should error out and pass the process", async () => {
      // setup
      const latestVersion = `${currentMajor + 1}.0.0`;
      httpClientStub.callsArgWith(3, null, TEST_NPM_REGISTRY_DATA(latestVersion));
      // call
      await AbstractCommand.prototype._remindsIfNewVersion(TEST_DO_DEBUG_FALSE, undefined);
      // verify
      expect(httpClientStub.args[0][0].url).equal(`${CONSTANTS.NPM_REGISTRY_URL_BASE}/${CONSTANTS.APPLICATION_NAME}/latest`);
      expect(httpClientStub.args[0][0].method).equal(CONSTANTS.HTTP_REQUEST.VERB.GET);
      expect(warnStub.args[0][0]).equal(`\
New MAJOR version (v${latestVersion}) of ${CONSTANTS.APPLICATION_NAME} is available now. Current version v${packageJson.version}.
It is recommended to use the latest version. Please update using "npm upgrade -g ${CONSTANTS.APPLICATION_NAME}".
\n`);
    });

    it("| new minor version released, should warn out and pass the process", async () => {
      // setup
      const latestVersion = `${currentMajor}.${currentMinor + 1}.0`;
      httpClientStub.callsArgWith(3, null, TEST_NPM_REGISTRY_DATA(latestVersion));
      // call
      await AbstractCommand.prototype._remindsIfNewVersion(TEST_DO_DEBUG_FALSE, undefined);
      // verify
      expect(httpClientStub.args[0][0].url).equal(`${CONSTANTS.NPM_REGISTRY_URL_BASE}/${CONSTANTS.APPLICATION_NAME}/latest`);
      expect(httpClientStub.args[0][0].method).equal(CONSTANTS.HTTP_REQUEST.VERB.GET);
      expect(warnStub.args[0][0]).equal(`\
New MINOR version (v${latestVersion}) of ${CONSTANTS.APPLICATION_NAME} is available now. Current version v${packageJson.version}.
It is recommended to use the latest version. Please update using "npm upgrade -g ${CONSTANTS.APPLICATION_NAME}".
\n`);
    });

    it("| version is latest, should do nothing and pass the process", async () => {
      // setup
      httpClientStub.callsArgWith(3, null, TEST_NPM_REGISTRY_DATA(`${currentMajor}.${currentMinor}.0`));
      // call
      await AbstractCommand.prototype._remindsIfNewVersion(TEST_DO_DEBUG_FALSE, undefined);
      // verify
      expect(httpClientStub.args[0][0].url).equal(`${CONSTANTS.NPM_REGISTRY_URL_BASE}/${CONSTANTS.APPLICATION_NAME}/latest`);
      expect(httpClientStub.args[0][0].method).equal(CONSTANTS.HTTP_REQUEST.VERB.GET);
      expect(infoStub.callCount).equal(0);
      expect(warnStub.callCount).equal(0);
      expect(errorStub.callCount).equal(0);
    });
  });

  describe("# check AppConfig object ", () => {
    const mockOptionModel = {
      "foo-option": {
        name: "foo-option",
        description: "foo option",
        alias: "f",
        stringInput: "REQUIRED",
      },
      "bar-option": {
        name: "bar-option",
        description: "bar option",
        alias: "b",
        stringInput: "REQUIRED",
      },
      "another-bar-option": {
        name: "another-bar-option",
        description: "another bar option",
        alias: "a",
        stringInput: "OPTIONAL",
      },
      "baz-option": {
        name: "baz-option",
        description: "baz option",
        alias: "z",
        stringInput: "NONE",
      },
      profile: {
        name: "profile",
        description: "profile option",
        alias: "p",
        stringInput: "REQUIRED",
      },
    };

    let AppConfigReadStub: sinon.SinonStub;
    let errorStub: sinon.SinonStub, warnStub: sinon.SinonStub, infoStub: sinon.SinonStub;

    beforeEach(() => {
      AppConfigReadStub = sinon.stub(AppConfig.prototype, "read");
      sinon.stub(process, "exit");
      errorStub = sinon.stub();
      warnStub = sinon.stub();
      infoStub = sinon.stub();
      sinon.stub(Messenger, "getInstance").returns({
        info: infoStub,
        warn: warnStub,
        error: errorStub,
      });
      sinon.stub(httpClient, "request").yields({statusCode: 200});
    });

    it("| should not be null for non-configure commands", async () => {
      const handleStub = sinon.stub().resolves();

      class NonConfigureCommand extends AbstractCommand {
        constructor(optionModel: OptionModel) {
          super(optionModel);
        }

        name() {
          return "random";
        }

        optionalOptions() {
          return ["profile"];
        }

        description() {
          return "random description";
        }

        handle(options: Record<string, any>) {
          return handleStub(options);
        }

        requiredOptions(): string[] {
          return [];
        }
      }

      const mockCommand = new NonConfigureCommand(mockOptionModel);

      mockCommand.createCommand()(commander);
      await commander.parseAsync(["node", "mock", "random", "--profile", TEST_PROFILE]);

      expect(handleStub).calledWithMatch(
        sinon.match({
          _name: "random",
          _description: "random description",
        }),
      );

      expect(AppConfigReadStub).called;
    });

    it("| should be null for configure command", async () => {
      const handleStub = sinon.stub().resolves();

      class ConfigureCommand extends AbstractCommand {
        constructor(optionModel: OptionModel) {
          super(optionModel);
        }

        name() {
          return "configure";
        }

        description() {
          return "configure description";
        }
        requiredOptions(): string[] {
          return [];
        }
        optionalOptions(): string[] {
          return [];
        }
        handle(cmd: any): Promise<void> {
          return handleStub(cmd);
        }
      }

      const mockCommand = new ConfigureCommand(mockOptionModel);

      mockCommand.createCommand()(commander);
      await commander.parseAsync(["node", "mock", "configure"]);

      expect(handleStub).calledWithMatch(
        sinon.match({
          _name: "configure",
          _description: "configure description",
          options: [],
        }),
      );

      expect(AppConfigReadStub).not.called;
    });

    afterEach(() => {
      sinon.restore();
      AppConfig.dispose();
    });
  });
});
