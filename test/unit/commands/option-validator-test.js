const {expect} = require("chai");
const sinon = require("sinon");
const fs = require("fs");

const optionValidator = require("../../../lib/commands/option-validator");
const Messenger = require("../../../lib/view/messenger");

describe("Command test - Option validator test", () => {
  it("| should validate required option value", () => {
    expect(() => {
      optionValidator.validateRequiredOption({foo: "value"}, "foo");
    }).not.throw();
    expect(() => {
      optionValidator.validateRequiredOption({foo: "value"}, "bar");
    }).throw("Field is required and must be set.");
  });

  it("| should validate string option value", () => {
    expect(() => {
      optionValidator.validateOptionString({foo: "value"}, "foo");
    }).not.throw();
    expect(() => {
      optionValidator.validateOptionString({foo: 123}, "foo");
    }).throw("Must be a string.");
    expect(() => {
      optionValidator.validateOptionString({foo: " "}, "foo");
    }).throw("Value must not be empty.");
  });

  describe("# validate option rules", () => {
    it("| should fallback to no-op if no rules are provided", () => {
      expect(() => {
        optionValidator.validateOptionRules({foo: "value"}, "foo", []);
      }).not.throw();
    });

    it("| should fallback to no-op if no rule validator is found for given rule type", () => {
      expect(() => {
        optionValidator.validateOptionRules({foo: "value"}, "foo", [{type: "nonExistentRule"}]);
      }).not.throw();
    });

    it("| should validate option rule model to have necessary metadata", (done) => {
      const mockConsoleError = sinon.stub(console, "error");
      const mockProcessExit = sinon.stub(process, "exit");
      new Messenger({});

      mockProcessExit.callsFake((code) => {
        expect(code).eq(1);
        expect(mockConsoleError.args[0][0]).include('[Fatal]: Option rule model of type "ENUM" requires field "values" to be set!');
        sinon.restore();
        done();
      });

      optionValidator.validateOptionRules(
        {
          foo: "value",
        },
        "foo",
        [
          {
            type: "ENUM",
          },
        ],
      );
    });

    it("| should validate enum value if rule ENUM is given", () => {
      expect(() => {
        optionValidator.validateOptionRules(
          {
            foo: "value-a",
          },
          "foo",
          [
            {
              type: "ENUM",
              values: ["value-a", "value-b"],
            },
          ],
        );
      }).not.throw();
      expect(() => {
        optionValidator.validateOptionRules(
          {
            foo: "value",
          },
          "foo",
          [
            {
              type: "ENUM",
              values: ["value-a", "value-b"],
            },
          ],
        );
      }).throw("Value must be in (value-a, value-b).");
    });

    it("| should validate regexp value if rule REGEX is given", () => {
      const localeOptions = {
        optionValid: "en-US",
        optionInvalid: "Mars",
      };

      const localeRegex = [
        {
          type: "REGEX",
          regex: "^[a-z]{2}-[A-Z]{2}$",
        },
      ];

      const skillOptions = {
        optionValid: "amzn1.ask.skill.1234abcd-12ab-abcd-1234-123456789012",
        optionValidLegacy: "amzn1.echo-sdk-ams.app.1234abcd-12ab-abcd-1234-123456789012",
        optionInvalid: "amzn1.ask.skill",
      };

      const skillRegex = [
        {
          type: "REGEX",
          regex: "^amzn\\d((\\.ask\\.skill)|(\\.echo-sdk-ams\\.app))\\.\\w{8}-\\w{4}-\\w{4}-\\w{4}-\\w{12}$",
        },
      ];

      // valid regex expectations
      expect(() => {
        optionValidator.validateOptionRules(localeOptions, "optionValid", localeRegex);
      }).not.throw();

      expect(() => {
        optionValidator.validateOptionRules(skillOptions, "optionValid", skillRegex);
      }).not.throw();

      expect(() => {
        optionValidator.validateOptionRules(skillOptions, "optionValidLegacy", skillRegex);
      }).not.throw();

      // invalid regex expectations
      expect(() => {
        optionValidator.validateOptionRules(skillOptions, "optionInvalid", skillRegex);
      }).throw(`Input value (${skillOptions.optionInvalid}) doesn't match REGEX rule ${skillRegex[0].regex}.`);

      expect(() => {
        optionValidator.validateOptionRules(localeOptions, "optionInvalid", localeRegex);
      }).throw(`Input value (${localeOptions.optionInvalid}) doesn't match REGEX rule ${localeRegex[0].regex}.`);
    });

    it("| should validate url value if rule URL is given", () => {
      const urlOptions = {
        optionValid: "https://example.com/example/example-skill.git",
        optionInvalid: "example",
      };

      const urlRule = [
        {
          type: "URL",
        },
      ];

      // valid URL expectations
      expect(() => {
        optionValidator.validateOptionRules(urlOptions, "optionValid", urlRule);
      }).not.throw();

      // invalid URL expectations
      expect(() => {
        optionValidator.validateOptionRules(urlOptions, "optionInvalid", urlRule);
      }).throw("Input should be a URL.");
    });

    it("| should validate number value if rule NUMBER is given", () => {
      expect(() => {
        optionValidator.validateOptionRules(
          {
            foo: "123",
          },
          "foo",
          [
            {
              type: "NUMBER",
            },
          ],
        );
      }).not.throw();
      expect(() => {
        optionValidator.validateOptionRules(
          {
            foo: "abc",
          },
          "foo",
          [
            {
              type: "NUMBER",
            },
          ],
        );
      }).throw("Input should be a number.");
    });

    it("| should validate integer value if rule INTEGER is given", () => {
      expect(() => {
        optionValidator.validateOptionRules(
          {
            foo: "123",
          },
          "foo",
          [
            {
              type: "INTEGER",
            },
          ],
        );
      }).not.throw();
      expect(() => {
        optionValidator.validateOptionRules(
          {
            foo: "123.1",
          },
          "foo",
          [
            {
              type: "INTEGER",
            },
          ],
        );
      }).throw("Input number should be an integer.");
    });

    it("| should validate csv file extension if rule FILE_PATH is given", () => {
      sinon.stub(fs, "accessSync");

      expect(() => {
        optionValidator.validateOptionRules(
          {
            file: "beta-testers.csv",
          },
          "file",
          [
            {
              type: "FILE_PATH",
              extension: [".csv"],
            },
          ],
        );
      }).not.throw();
      expect(() => {
        optionValidator.validateOptionRules(
          {
            file: "beta-testers.txt",
          },
          "file",
          [
            {
              type: "FILE_PATH",
              extension: [".csv"],
            },
          ],
        );
      }).throw("File extension is not of type .csv.");
    });
  });
});
