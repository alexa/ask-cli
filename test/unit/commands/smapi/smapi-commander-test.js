const {expect} = require("chai");
const sinon = require("sinon");
const {makeSmapiCommander} = require("../../../../lib/commands/smapi/smapi-commander");
const handler = require("../../../../lib/commands/smapi/smapi-command-handler");
const metricClient = require("../../../../lib/utils/metrics");

describe("Smapi test - makeSmapiCommander function", () => {
  beforeEach(() => {
    sinon.stub(process, "exit");
    sinon.stub(console, "error");
  });

  it("| should create instance of commander", () => {
    const commander = makeSmapiCommander();

    expect(commander._name).eql("ask smapi");
    expect(commander.commands.length).gt(0);
  });

  it("| should show command not recognized for unknown command", async () => {
    const commander = makeSmapiCommander();

    commander.emit("command:*");

    expect(console.error.calledWithMatch("Command not recognized")).eql(true);
  });

  it("| should execute a command successfully", () => {
    sinon.stub(handler, "smapiCommandHandler").resolves("some data");
    const commander = makeSmapiCommander();

    return commander.parseAsync(["", "", "list-skills-for-vendor"]).then((res) => expect(res[0]).eql("some data"));
  });

  it("| should initialize metrics when command starts", () => {
    sinon.stub(handler, "smapiCommandHandler").resolves("some data");

    // call
    const commander = makeSmapiCommander();
    commander.parseAsync(["", "", "list-skills-for-vendor", "--max-results", "4"]);
    
    // verify
    const data = metricClient.getData();
    expect(data).to.exist;

    const lastAction = data.actions[data.actions.length - 1];
    expect(lastAction.name).to.equal("smapi");
    expect(lastAction.type).to.equal("list-skills-for-vendor");

    const options = lastAction.options;
    expect(options).has.members(["max_results"]);
  });

  it("| should propagate error if handler fails", () => {
    sinon.stub(handler, "smapiCommandHandler").rejects(new Error("some error"));
    const commander = makeSmapiCommander();

    return commander
      .parseAsync(["", "", "list-skills-for-vendor"])
      .then((res) => expect(res).eql(undefined))
      .catch((err) => expect(err.message).eql("some error"));
  });

  afterEach(() => {
    sinon.restore();
  });
});
