import httpClient from "../../clients/http-client";
import R from "ramda";
import {TEMPLATES, HTTP_REQUEST, DEPLOYER_TYPE} from "../../utils/constants";
import {SampleTemplate, SampleTemplateFilterValues} from "../../model/sample-template";
import {CODE_LANGUAGE_JAVA, CODE_LANGUAGE_NODEJS, CODE_LANGUAGE_PYTHON} from ".";

export function getSampleTemplatesFromS3(doDebug: boolean): Promise<SampleTemplate[]> {
  return new Promise<SampleTemplate[]>((resolve, reject) => {
    const params = {
      url: TEMPLATES.TEMPLATE_S3_SOURCE_URL,
      method: HTTP_REQUEST.VERB.GET,
    };
    httpClient.request(params, "TEMPLATE_S3_SOURCE_URL", doDebug, (error: Error | null, response: any) => {
      if (error || !response.statusCode || response.statusCode !== 200) {
        const msg = doDebug
          ? "Failed to retrieve the skill sample templates."
          : "Failed to retrieve the skill sample templates. Please run again with --debug to see the details.";
        return reject(new Error(msg));
      }
      resolve(R.view(R.lensPath(["templates"]), JSON.parse(response?.body)));
    });
  });
}

export function convertUserInputToFilterValue(inputValue: string): SampleTemplateFilterValues {
  switch (inputValue.toLowerCase()) {
    case CODE_LANGUAGE_NODEJS.toLowerCase():
      return "node";
    case CODE_LANGUAGE_PYTHON.toLowerCase():
      return "python";
    case CODE_LANGUAGE_JAVA.toLowerCase():
      return "java";
    case DEPLOYER_TYPE.LAMBDA.NAME.toLowerCase():
      return "lambda";
    case DEPLOYER_TYPE.CFN.NAME.toLowerCase():
      return "cfn";
    case DEPLOYER_TYPE.HOSTED.NAME.toLowerCase():
      return "hosted";
    case DEPLOYER_TYPE.SELF_HOSTED.NAME.toLowerCase():
      return "self";
    default:
      throw new Error(`Unable to convert userInput '${inputValue}' to a sample template filter value.`);
  }
}
