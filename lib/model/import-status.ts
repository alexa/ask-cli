import {view, lensPath} from "ramda";

/**
 * type representing the getImportStatus SMAPI response resource's build statuses
 */
export type ImportBuildStatus = "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "ROLLBACK_IN_PROGRESS" | "ROLLBACK_SUCCEEDED" | "ROLLBACK_FAILED";

/**
 * Class to abstract a single resource object from the GetImportStatus SMAPI API response JSON
 *  {
 *    name:<InteractionModel.Locale>,
 *    status: <InteractionModel Build Status>
 *  }
 */
class ImportStatusResource {
  locale: string;
  status: ImportBuildStatus;
  constructor(locale: string, status: ImportBuildStatus) {
    this.locale = locale;
    this.status = status;
  }
}

/**
 * A warning object that is returned in from the SMAPI getSkillStatus API response.
 */
interface ImportStatusWarning {
  message: string;
}

/**
 * Class to abstract the skillId and resources from the SMAPI getSkillStatus API response JSON
 * {
 *   body: {
 *     skill: {
 *       skillId: <SkillId of the skill in question>,
 *       resources: [
 *         {
 *           action: <InteractionModel Action Type>,
 *           name:<InteractionModel.Locale>,
 *           status: <InteractionModel Build Status>
 *         },
 *         ...
 *       ]
 *     }
 *   }
 * }
 */
export class ImportStatus {
  resources: ImportStatusResource[];
  skillId: string;
  warnings: ImportStatusWarning[];

  constructor(pollImportStatusResponse: object) {
    this.skillId = view(lensPath(["body", "skill", "skillId"]), pollImportStatusResponse);
    this.warnings = view(lensPath(["body", "warnings"]), pollImportStatusResponse) || [];
    this.resources = new Array();
    const resources = view(lensPath(["body", "skill", "resources"]), pollImportStatusResponse) || [];
    resources.forEach((res: object) => {
      const name: string = view(lensPath(["name"]), res);
      const status: ImportBuildStatus = view(lensPath(["status"]), res);
      this.resources.push(new ImportStatusResource(this._getLocaleFromInteractionModel(name), status));
    });
  }

  private _getLocaleFromInteractionModel(interactionModelName: string): string {
    return interactionModelName ? interactionModelName.replace("InteractionModel.", "") : "";
  }
}
