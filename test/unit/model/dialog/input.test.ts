import {expect} from "chai";
import {inputToCommand, SpecialCommand} from "../../../../lib/model/dialog/inputs";

describe("Dialog Model - Input Helpers", () => {
  describe("input to command", () => {
    it("resolves commands from inputs", () => {
      expect(inputToCommand(".quit")).equals(SpecialCommand.QUIT);
    });

    it("is case insensitive", () => {
      expect(inputToCommand(".Quit")).equals(SpecialCommand.QUIT);
    });

    it("unknown commands return unknown", () => {
      expect(inputToCommand(".hi")).equals(SpecialCommand.UNKNOWN);
    });
  });
});
