import {SKILL} from "../../lib/utils/constants";
import {view, lensPath} from "ramda";

export type BuildStatus = "SUCCEEDED" | "FAILED" | "IN_PROGRESS" | "";

export type BuildType =
  | "LANGUAGE_MODEL_QUICK_BUILD"
  | "LANGUAGE_MODEL_FULL_BUILD"
  | "ALEXA_CONVERSATIONS_QUICK_BUILD"
  | "ALEXA_CONVERSATIONS_FULL_BUILD";

export const IM_QUICK_BUILD: BuildType = "LANGUAGE_MODEL_QUICK_BUILD";
export const IM_FULL_BUILD: BuildType = "LANGUAGE_MODEL_FULL_BUILD";
export const AC_QUICK_BUILD: BuildType = "ALEXA_CONVERSATIONS_QUICK_BUILD";
export const AC_FULL_BUILD: BuildType = "ALEXA_CONVERSATIONS_FULL_BUILD";

export enum BuildLocale {
  "ar-SA" = "ar-SA",
  "de-DE" = "de-DE",
  "en-AU" = "en-AU",
  "en-CA" = "en-CA",
  "en-GB" = "en-GB",
  "en-IN" = "en-IN",
  "en-US" = "en-US",
  "es-ES" = "es-ES",
  "es-MX" = "es-MX",
  "es-US" = "es-US",
  "fr-CA" = "fr-CA",
  "fr-FR" = "fr-FR",
  "hi-IN" = "hi-IN",
  "it-IT" = "it-IT",
  "ja-JP" = "ja-JP",
  "pt-BR" = "pt-BR",
}

/**
 * Class to abstract Build Details for a specific Step from the SMAPI getSkillStatus API response JSON
 *
 */
export class BuildDetailStep {
  buildType: BuildType;
  buildStatus: BuildStatus;
  isACBuildType: boolean;

  /**
   * Constructs a BuildDetailStep object which holds the BuildDetails Step's BuildType and BuildStatus
   * @param {BuildType} buildType The specific BuildType for this BuildDetails Step
   * @param {BuildStatus} buildStatus The BuildStatus for this BuildDetails Step
   */
  constructor(buildType: BuildType, buildStatus: BuildStatus) {
    this.buildType = buildType;
    this.buildStatus = buildStatus;
    this.isACBuildType = buildType === AC_QUICK_BUILD || buildType === AC_FULL_BUILD;
  }
}

/**
 * Class to abstract the LastUpdateRequest from the SMAPI getSkillStatus API response JSON
 *   lastUpdateRequest: {
 *     status: 'SUCCEEDED|FAILED|IN_PROGRESS',
 *     buildDetails: {
 *       steps: [
 *         {
 *           name: <BuildType>,
 *           status: <BuildStatus>
 *         }
 *         ...
 *       ]
 *     }
 *   }
 */
export class LastUpdateRequest {
  locale: BuildLocale;
  overallBuildStatus: BuildStatus;
  buildDetailSteps: {[key: string]: BuildDetailStep};
  /**
   * Constructor for building a LastUpdateRequest Object
   * @param {BuildLocale} locale The InteractionModel Locale for this LastUpdateRequest object
   * @param lastUpdateRequest the InteractionModel Locale JSON node of the SMAPI getSkillStatus API response
   */
  constructor(locale: BuildLocale, lastUpdateRequest: object) {
    this.locale = locale;
    const currentBuildStatus = view(lensPath(["lastUpdateRequest", "status"]), lastUpdateRequest) || "";
    this.overallBuildStatus = currentBuildStatus;
    const steps = view(lensPath(["lastUpdateRequest", "buildDetails", "steps"]), lastUpdateRequest) || [];
    this.buildDetailSteps = {};
    steps.forEach((step: object) => {
      const name = view(lensPath(["name"]), step) || "";
      const status = view(lensPath(["status"]), step) || "";
      this.buildDetailSteps[name] = new BuildDetailStep(name, status);
    });
  }

  /**
   * Retrieves BuildDetailStep using the Build Type Name
   * @param {string} buildTypeName build type name
   * @returns {BuildDetailStep}
   */
  getBuildDetailStep(buildTypeName: string): BuildDetailStep {
    return this.buildDetailSteps[buildTypeName];
  }
}

/**
 * Class to abstract the InteractionModel from the SMAPI getSkillStatus API response JSON
 *   body: {
 *     interactionModel: {
 *       'en-US': {
 *          <LastUpdateRequest content>
 *       }
 *       <...all other skill locales>
 *     }
 *   }
 */
export class InteractionModel {
  lastUpdateRequests: LastUpdateRequest[];
  /**
   * Constructor function to instantiate an InteractionModel object
   * @param skillStatusResponse the SMAPI getSkillStatus API response JSON which has the top level "body" field
   */
  constructor(skillStatusResponse: object) {
    const interactionModel = view(lensPath(["body", SKILL.RESOURCES.INTERACTION_MODEL]), skillStatusResponse) || {};
    this.lastUpdateRequests = new Array();
    Object.keys(interactionModel).forEach((key: string) => {
      const locale: BuildLocale = key as BuildLocale;
      this.lastUpdateRequests.push(new LastUpdateRequest(locale, interactionModel[key]));
    });
  }
}

/**
 * Top Level Skill Status object representing a SMAPI getSkillStatus API response
 */
export class SkillStatus {
  interactionModel: InteractionModel;
  /**
   * Constructor function to instantiate a SkillStatus object
   * @param skillStatusResponse the SMAPI getSkillStatus API response JSON which has the "body" field
   */
  constructor(skillStatusResponse: object) {
    this.interactionModel = new InteractionModel(skillStatusResponse);
  }
}
