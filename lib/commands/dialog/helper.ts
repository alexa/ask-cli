import {ISmapiClient, isSmapiError, SmapiResponseError} from "../../clients/smapi-client";

/**
 * Validates if a skill is enabled for simulation. Calls Skill Management apis (SMAPI) to achieve this.
 * @param {*} dialogMode encapsulates configuration required validate skill information
 * @param {*} callback
 */
export async function validateDialogArgs(dialogMode: {smapiClient: ISmapiClient; skillId: string; stage: string; locale: string}) {
  const {smapiClient, skillId, stage, locale} = dialogMode;

  const response = await smapiClient.skill.manifest.getManifest(skillId, stage);

  if (isSmapiError(response)) {
    throw smapiErrorMsg("get-manifest", response);
  }

  const apis = response.body.manifest?.apis;
  if (!apis) {
    throw 'Ensure "manifest.apis" object exists in the skill manifest.';
  }

  const apisKeys = Object.keys(apis);
  if (!apisKeys || apisKeys.length !== 1) {
    throw "Dialog command only supports custom skill type.";
  }

  if (apisKeys[0] !== "custom") {
    throw `Dialog command only supports custom skill type, but current skill is a "${apisKeys[0]}" type.`;
  }

  const locales = response.body.manifest?.publishingInformation?.locales;
  if (!locales) {
    throw 'Ensure the "manifest.publishingInformation.locales" exists in the skill manifest before simulating your skill.';
  }

  if (!locales[locale]) {
    throw `Locale ${locale} was not found for your skill. Ensure the locale you want to simulate exists in your publishingInformation.`;
  }

  const enableResponse = await smapiClient.skill.getSkillEnablement(skillId, stage);

  if (isSmapiError(enableResponse)) {
    throw smapiErrorMsg("get-skill-enablement", enableResponse);
  }
}

function smapiErrorMsg(operation: string, res: SmapiResponseError) {
  return `SMAPI ${operation} request error: ${res.statusCode} - ${res.body.message}`;
}
