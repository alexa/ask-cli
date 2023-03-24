export type ImportStatusViewEvents =
  | "buildingACLight"
  | "buildingACFull"
  | "buildACSuccess"
  | "buildACFailed"
  | "buildIMSuccess"
  | "buildIMFailed"
  | "fetchingSkillIdSuccess"
  | "fetchingNewSkillIdSuccess"
  | "fetchingImportIdSuccess"
  | "fetchingIdFailed"
  | "cancelTask";
export const IMPORT_STATUS_BUILDING_AC_LIGHT_EVENT: ImportStatusViewEvents = "buildingACLight";
export const IMPORT_STATUS_BUILDING_AC_FULL_EVENT: ImportStatusViewEvents = "buildingACFull";
export const IMPORT_STATUS_AC_BUILD_SUCCESS_EVENT: ImportStatusViewEvents = "buildACSuccess";
export const IMPORT_STATUS_AC_BUILD_FAILED_EVENT: ImportStatusViewEvents = "buildACFailed";
export const IMPORT_STATUS_IM_BUILD_SUCCESS_EVENT: ImportStatusViewEvents = "buildIMSuccess";
export const IMPORT_STATUS_IM_BUILD_FAILED_EVENT: ImportStatusViewEvents = "buildIMFailed";
export const IMPORT_STATUS_FETCHING_SKILL_ID_SUCESS_EVENT: ImportStatusViewEvents = "fetchingSkillIdSuccess";
export const IMPORT_STATUS_FETCHING_NEW_SKILL_ID_SUCESS_EVENT: ImportStatusViewEvents = "fetchingNewSkillIdSuccess";
export const IMPORT_STATUS_FETCHING_IMPORT_ID_SUCESS_EVENT: ImportStatusViewEvents = "fetchingImportIdSuccess";
export const IMPORT_STATUS_CANCEL_TASK_EVENT: ImportStatusViewEvents = "cancelTask";
