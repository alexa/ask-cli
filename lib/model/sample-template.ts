type IM = "im";
type AC = "ac";
type ALEXA_HOSTED = "hosted";
type CLOUDFORMATION = "cfn";
type LAMBDA = "lambda";
type SELF_HOSTED = "self";
type NODE = "node";
type PYTHON = "python";
type JAVA = "java";
export type SampleTemplateFilterValues = IM | AC | ALEXA_HOSTED | CLOUDFORMATION | LAMBDA | SELF_HOSTED | NODE | PYTHON | JAVA;

/**
 *
 * Interface representation of a specific skill sample template blob.
 *
 * example:
 * {
 *     "stack": "ac",
 *     "deploy": "lambda",
 *     "lang": "node",
 *     "name": "hello world",
 *     "url": "https://github.com/alexa/skill-sample-nodejs-hello-world.git",
 *     "desc": "Alexa's hello world skill to send the greetings to the world!"
 * }
 */
export interface SampleTemplate {
  stack: IM | AC;
  deploy: ALEXA_HOSTED | CLOUDFORMATION | LAMBDA | SELF_HOSTED;
  lang: NODE | PYTHON | JAVA;
  name: string;
  url: string;
  desc: string;
  branch?: string;
}

/**
 *
 * Interface representation of a flat list of skill sample templates.
 *
 */
export interface SampleTemplates {
  templates: SampleTemplate[];
}

/**
 *
 * Class representing a generic array of skill sample templates, which allows filtering of samples based on user input
 *
 * { "templates": [] }
 *
 */
export class SampleTemplatesFilter implements SampleTemplates {
  templates: SampleTemplate[];

  constructor(samples: SampleTemplate[]) {
    this.templates = samples;
  }

  /**
   * Filters unneeded sample templates from the sampleTemplates list
   *
   * @param key SampleTemplate key to filter
   * @param value value of the key to filter. Must be one of types SampleTemplateFilterValues
   */
  filter<K extends keyof SampleTemplate>(key: K, value: SampleTemplateFilterValues): void {
    this.templates = this.templates.filter((sample) => sample[key] === value);
  }

  /**
   * The remaining SampleTemplates
   *
   * @returns Array of SampleTemplate that have not been filtered
   */
  getSampleTemplates(): SampleTemplate[] {
    return this.templates;
  }
}
