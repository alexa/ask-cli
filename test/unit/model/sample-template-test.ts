import {expect} from "chai";
import {
  SampleTemplate,
  SampleTemplatesFilter,
  SampleTemplateFilterValues,
} from "../../../lib/model/sample-template";

describe("Sample Templates", () => {
  const SAMPLE_1: SampleTemplate = {
    stack: "ac",
    deploy: "lambda",
    lang: "node",
    name: "sample1",
    url: "http://www.smaple1.com/repo.git",
    desc: "describe sample 1",
  };
  const SAMPLE_2: SampleTemplate = {
    stack: "im",
    deploy: "hosted",
    lang: "python",
    name: "sample_2",
    url: "http://www.smaple2.com/repo.git",
    desc: "describe sample 2",
  };
  const SAMPLE_3: SampleTemplate = {
    stack: "im",
    deploy: "cfn",
    lang: "java",
    name: "sample 3",
    url: "http://www.smaple3.com/repo.git",
    desc: "describe sample 3",
  };
  const SAMPLE_4: SampleTemplate = {
    stack: "im",
    deploy: "self",
    lang: "node",
    name: "sample 4",
    url: "http://www.smaple4.com/repo.git",
    desc: "describe sample 4",
  };

  let testSampleTemplates: SampleTemplate[];
  

  beforeEach(() => {
    testSampleTemplates = [SAMPLE_1, SAMPLE_2, SAMPLE_3, SAMPLE_4];
  });

  describe("SampleTemplateFilter class", () => {
    it("filters SampleTemplates by skill type", () => {
      expect(filter(testSampleTemplates, "stack", "im")).deep.equal([SAMPLE_2, SAMPLE_3, SAMPLE_4]);
      expect(filter(testSampleTemplates, "stack", "ac")).deep.equal([SAMPLE_1]);
    });

    it("filters SampleTemplates by deployment type", () => {
      expect(filter(testSampleTemplates, "deploy", "lambda")).deep.equal([SAMPLE_1]);
      expect(filter(testSampleTemplates, "deploy", "hosted")).deep.equal([SAMPLE_2]);
      expect(filter(testSampleTemplates, "deploy", "cfn")).deep.equal([SAMPLE_3]);
      expect(filter(testSampleTemplates, "deploy", "self")).deep.equal([SAMPLE_4]);
    });

    it("filters SampleTemplates by language type", () => {
      expect(filter(testSampleTemplates, "lang", "node")).deep.equal([SAMPLE_1, SAMPLE_4]);
      expect(filter(testSampleTemplates, "lang", "python")).deep.equal([SAMPLE_2]);
      expect(filter(testSampleTemplates, "lang", "java")).deep.equal([SAMPLE_3]);
    });

    it("filters all SampleTemplates when there are no matches", () => {
      expect(filter([SAMPLE_1], "stack", "im")).deep.equal([]);
      expect(filter([SAMPLE_1], "deploy", "hosted")).deep.equal([]);
      expect(filter([SAMPLE_1], "lang", "java")).deep.equal([]);
    });

    function filter(
      samples: SampleTemplate[],
      filter_key: keyof SampleTemplate,
      filter_value: SampleTemplateFilterValues,
    ): SampleTemplate[] {
      const sampleTemplatesFilter: SampleTemplatesFilter = new SampleTemplatesFilter(samples);
      sampleTemplatesFilter.filter(filter_key, filter_value);
      return sampleTemplatesFilter.getSampleTemplates();
    }
  });
});
