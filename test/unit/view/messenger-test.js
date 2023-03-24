const {expect} = require("chai");
const sinon = require("sinon");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const Messenger = require("../../../lib/view/messenger");

describe("View test - messenger file test", () => {
  const TEST_MESSAGE = "TEST_MESSAGE";
  const TEST_TIME = "TEST_TIME";
  const TEST_ERROR_OBJ = new Error("TEST_ERROR");

  describe("# inspect correctness for constructor, getInstance and dispose", () => {
    beforeEach(() => {
      sinon.stub(fs, "writeFileSync");
    });

    it("| initiate as a Messenger class", () => {
      const messenger = new Messenger({doDebug: false});
      expect(messenger).to.be.instanceof(Messenger);
      expect(Messenger.getInstance()).to.be.instanceof(Messenger);
    });

    it("| make sure Messenger class is singleton", () => {
      const messenger1 = new Messenger({doDebug: false});
      const messenger2 = new Messenger({doDebug: false});
      expect(messenger1 === messenger2).equal(true);
    });

    it("| get instance function return the instance constructed before", () => {
      const messenger = new Messenger({doDebug: false});
      expect(Messenger.getInstance() === messenger).equal(true);
    });

    it("| init with doDebug parameter not existing, expect doDebug property equal to false ", () => {
      const messenger = new Messenger({doDebug: false});
      expect(messenger.doDebug).equal(false);
    });

    it("| init with doDebug parameter equal to true, expect doDebug property equal to true ", () => {
      const messenger = new Messenger({doDebug: true});
      expect(messenger.doDebug).equal(true);
    });

    afterEach(() => {
      Messenger.getInstance().dispose();
      sinon.restore();
    });
  });

  describe("# inspect all log methods and make sure they work well on debug mode", () => {
    beforeEach(() => {
      new Messenger({doDebug: true});
      sinon.stub(Messenger, "getTime").callsFake(() => TEST_TIME);
      sinon.stub(fs, "writeFileSync");
    });

    it("| debug function correctly push message to buffer, and can display message on debug mode", () => {
      const stub = sinon.stub(console, "warn");
      const expectedItem = {
        time: TEST_TIME,
        operation: "DEBUG",
        level: 20,
        msg: TEST_MESSAGE,
      };

      // call
      Messenger.getInstance().debug(TEST_MESSAGE);

      // verify
      expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);
      expect(stub.args[0][0]).equal(chalk`{gray [Debug]: ${TEST_MESSAGE}}`);
    });

    it("| debug function does not populate the local buffer, and displays nothing when debug mode is not enabled", () => {
      Messenger.getInstance().dispose();
      new Messenger({doDebug: false});
      const stub = sinon.stub(console, "warn");
      const expectedItem = {
        time: TEST_TIME,
        operation: "DEBUG",
        level: 20,
        msg: TEST_MESSAGE,
      };
      sinon.spy(Messenger, "displayWithStyle");

      // call
      Messenger.getInstance().debug(TEST_MESSAGE);

      // verify
      expect(Messenger.getInstance()._buffer.length).to.equal(0);
      expect(Messenger.displayWithStyle.calledOnce).equal(false);
      expect(stub.called).equal(false);
    });

    it("| info function correctly push message to buffer and display", () => {
      const stub = sinon.stub(console, "log");
      const expectedItem = {
        time: TEST_TIME,
        operation: "INFO",
        level: 30,
        msg: TEST_MESSAGE,
      };

      // call
      Messenger.getInstance().info(TEST_MESSAGE);

      // verify
      expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);
      expect(stub.args[0][0]).equal(`${TEST_MESSAGE}`);

      // restore console.log first, otherwise cannot print test result to console
      console.log.restore();
    });

    it("| warn function correctly push message to buffer and display", () => {
      const stub = sinon.stub(console, "warn");
      const expectedItem = {
        time: TEST_TIME,
        operation: "WARN",
        level: 40,
        msg: TEST_MESSAGE,
      };

      // call
      Messenger.getInstance().warn(TEST_MESSAGE);

      // verify
      expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);
      expect(stub.args[0][0]).equal(chalk`{bold.yellow [Warn]: ${TEST_MESSAGE}}`);
    });

    it("| error function correctly push message to buffer and display", () => {
      const stub = sinon.stub(console, "error");
      const expectedItem = {
        time: TEST_TIME,
        operation: "ERROR",
        level: 50,
        msg: TEST_MESSAGE,
      };

      // call
      Messenger.getInstance().error(TEST_MESSAGE);

      // verify
      expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);
      expect(stub.args[0][0]).equal(chalk`{bold.red [Error]: ${TEST_MESSAGE}}`);
    });

    it("| fatal function correctly push message to buffer and display", () => {
      const stub = sinon.stub(console, "error");
      const expectedItem = {
        time: TEST_TIME,
        operation: "FATAL",
        level: 60,
        msg: TEST_MESSAGE,
      };

      // call
      Messenger.getInstance().fatal(TEST_MESSAGE);

      // verify
      expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);
      expect(stub.args[0][0]).equal(chalk`{bold.rgb(128, 0, 0) [Fatal]: ${TEST_MESSAGE}}`);
    });

    it("| fatal function correctly push error stack to buffer and display", () => {
      const stub = sinon.stub(console, "error");
      const expectedItem = {
        time: TEST_TIME,
        operation: "FATAL",
        level: 60,
        msg: TEST_ERROR_OBJ.stack.substring(7),
      };

      // call
      Messenger.getInstance().fatal(TEST_ERROR_OBJ);

      // verify
      expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);
      expect(stub.args[0][0]).equal(chalk`{bold.rgb(128, 0, 0) [Fatal]: ${TEST_ERROR_OBJ.stack.substring(7)}}`);
    });

    it("| trace function correctly push message to buffer and write to file with complete message", () => {
      const TEST_ACTIVITY = "TEST_ACTIVITY";
      const TEST_METHOD = "TEST_METHOD";
      const TEST_URL = "TEST_URL";
      const TEST_HEADERS = "TEST_HEADERS";
      const TEST_BODY = "TEST_BODY";
      const TEST_STATUS_CODE = "TEST_STATUS_CODE";
      const TEST_STATUS_MESSAGE = "TEST_STATUS_MESSAGE";
      const TEST_ERROR = "TEST_ERROR";
      const TEST_REQUEST_ID = "TEST_REQUEST_ID";
      const message = {
        activity: TEST_ACTIVITY,
        request: {
          method: TEST_METHOD,
          url: TEST_URL,
          headers: TEST_HEADERS,
          body: TEST_BODY,
        },
        response: {
          statusCode: TEST_STATUS_CODE,
          statusMessage: TEST_STATUS_MESSAGE,
          headers: TEST_HEADERS,
        },
        error: "TEST_ERROR",
        "request-id": TEST_REQUEST_ID,
        body: TEST_BODY,
      };
      const expectedItem = {
        time: TEST_TIME,
        operation: "TRACE",
        level: 10,
        msg: message,
      };
      const expectedContent = [
        `\n[TEST_TIME] - TRACE - ${TEST_ACTIVITY}`,
        `\nrequest-id: ${TEST_REQUEST_ID}`,
        `\nTEST_METHOD ${TEST_URL}`,
        `\nstatus code: ${TEST_STATUS_CODE} ${TEST_STATUS_MESSAGE}`,
        `\nerror: ${TEST_ERROR}\n`,
        `\nRequest headers: ${JSON.stringify("TEST_HEADERS")}`,
        `\nRequest body: ${TEST_BODY}`,
        `\nResponse headers: ${JSON.stringify(TEST_HEADERS)}`,
        `\nResponse body: ${JSON.stringify(TEST_BODY)}`,
        "\n----------------------------------------",
      ];
      const filePath = path.join(process.cwd(), `ask-cli-${TEST_TIME}.log`);
      sinon.stub(console, "log");

      // call
      Messenger.getInstance().trace(message);

      // verify
      expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);

      // call
      Messenger.getInstance().dispose();

      // verify
      expect(fs.writeFileSync.args[0][0]).deep.equal(filePath);
      expect(fs.writeFileSync.args[0][1]).deep.equal(expectedContent);
      expect(console.log.args[0][0]).equal(`\nDetail log has been recorded at ${filePath}`);

      // restore console.log first, otherwise cannot print test result to console
      console.log.restore();
    });

    it("| trace function correctly push message to buffer and write to file with incomplete message", () => {
      const TEST_ACTIVITY = "TEST_ACTIVITY";
      const TEST_METHOD = "TEST_METHOD";
      const TEST_URL = "TEST_URL";
      const TEST_HEADERS = "TEST_HEADERS";
      const TEST_STATUS_CODE = "TEST_STATUS_CODE";
      const TEST_STATUS_MESSAGE = "TEST_STATUS_MESSAGE";
      const message = {
        activity: TEST_ACTIVITY,
        request: {
          method: TEST_METHOD,
          url: TEST_URL,
          headers: TEST_HEADERS,
        },
        response: {
          statusCode: TEST_STATUS_CODE,
          statusMessage: TEST_STATUS_MESSAGE,
          headers: TEST_HEADERS,
        },
      };
      const expectedItem = {
        time: TEST_TIME,
        operation: "TRACE",
        level: 10,
        msg: message,
      };
      const expectedContent = [
        `\n[TEST_TIME] - TRACE - ${TEST_ACTIVITY}`,
        `\nTEST_METHOD ${TEST_URL}`,
        `\nstatus code: ${TEST_STATUS_CODE} ${TEST_STATUS_MESSAGE}`,
        `\nRequest headers: ${JSON.stringify("TEST_HEADERS")}`,
        `\nResponse headers: ${JSON.stringify(TEST_HEADERS)}`,
        "\n----------------------------------------",
      ];
      const filePath = path.join(process.cwd(), `ask-cli-${TEST_TIME}.log`);
      sinon.stub(console, "log");

      // call
      Messenger.getInstance().trace(message);

      // verify
      expect(Messenger.getInstance()._buffer[0]).deep.equal(expectedItem);

      // call
      Messenger.getInstance().dispose();

      // verify
      expect(fs.writeFileSync.args[0][0]).deep.equal(filePath);
      expect(fs.writeFileSync.args[0][1]).deep.equal(expectedContent);
      expect(console.log.args[0][0]).equal(`\nDetail log has been recorded at ${filePath}`);

      // restore console.log first, otherwise cannot print test result to console
      console.log.restore();
    });

    afterEach(() => {
      Messenger.getInstance().dispose();
      sinon.restore();
    });
  });

  describe("Pause and resume functionality", () => {
    let displayWithStyleStub;

    beforeEach(() => {
      displayWithStyleStub = sinon.stub(Messenger, "displayWithStyle");
      displayWithStyleStub.returns();
    });

    afterEach(() => {
      Messenger.getInstance().dispose();
      sinon.restore();
    });

    it("| calling pause(), pauses the display messages", () => {
      Messenger.getInstance().pause();
      Messenger.getInstance().info(TEST_MESSAGE);
      Messenger.getInstance().warn(TEST_MESSAGE);
      Messenger.getInstance().error(TEST_MESSAGE);
      expect(displayWithStyleStub).not.be.called;
    });

    it("| calling resume() after pause(), writes all the messages that were received while paused", () => {
      Messenger.getInstance().pause();
      Messenger.getInstance().info(TEST_MESSAGE);
      Messenger.getInstance().warn(TEST_MESSAGE);
      Messenger.getInstance().error(TEST_MESSAGE);
      expect(displayWithStyleStub).not.be.called;
      Messenger.getInstance().resume();
      expect(displayWithStyleStub).be.calledThrice;
      expect(displayWithStyleStub.args[0][0]).to.be.null;
      expect(displayWithStyleStub.args[0][1]).to.equal("log");
      expect(displayWithStyleStub.args[0][3]).to.contain(TEST_MESSAGE);
      expect(displayWithStyleStub.args[1][0]).to.equal("yellow");
      expect(displayWithStyleStub.args[1][1]).to.equal("warn");
      expect(displayWithStyleStub.args[1][3]).to.contain(TEST_MESSAGE);
      expect(displayWithStyleStub.args[2][0]).to.equal("red");
      expect(displayWithStyleStub.args[2][1]).to.equal("error");
      expect(displayWithStyleStub.args[2][3]).to.contain(TEST_MESSAGE);
    });

    it("| resume doesn't write previous messages posted before pause was called", () => {
      Messenger.getInstance().info(TEST_MESSAGE);
      Messenger.getInstance().pause();
      Messenger.getInstance().warn(TEST_MESSAGE);
      Messenger.getInstance().error(TEST_MESSAGE);
      expect(displayWithStyleStub).be.calledOnce;
      Messenger.getInstance().resume();
      expect(displayWithStyleStub).be.calledThrice;
    });

    it("| resume called multiple times only prints paused messages once", () => {
      Messenger.getInstance().pause();
      Messenger.getInstance().info(TEST_MESSAGE);
      expect(displayWithStyleStub).not.be.called;
      Messenger.getInstance().resume();
      Messenger.getInstance().resume();
      Messenger.getInstance().resume();
      expect(displayWithStyleStub).be.calledOnce;
    });

    it("| messages posted after pause/resume are posted immediately", () => {
      Messenger.getInstance().pause();
      Messenger.getInstance().info(TEST_MESSAGE);
      expect(displayWithStyleStub).not.be.called;
      Messenger.getInstance().resume();
      expect(displayWithStyleStub).be.calledOnce;
      Messenger.getInstance().warn(TEST_MESSAGE);
      Messenger.getInstance().error(TEST_MESSAGE);
      expect(displayWithStyleStub).be.calledThrice;
    });

    it("| resume is called upon disposing", () => {
      Messenger.getInstance().pause();
      Messenger.getInstance().info(TEST_MESSAGE);
      expect(displayWithStyleStub).not.be.called;
      Messenger.getInstance().dispose();
      expect(displayWithStyleStub).be.calledOnce;
    });
  });

  it("| displayWithStyle can print bold but no color font", () => {
    new Messenger({doDebug: true});
    const stub = sinon.stub(console, "error");
    Messenger.displayWithStyle(null, "error", true, TEST_MESSAGE);
    expect(stub.args[0][0]).equal(chalk`{bold ${TEST_MESSAGE}}`);
    sinon.restore();
  });
});
