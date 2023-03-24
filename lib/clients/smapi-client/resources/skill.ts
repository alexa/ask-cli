import {SmapiRequest, SmapiRequestCallback, SmapiResponse} from "..";

import R from "ramda";
import querystring from "querystring";
import CONSTANTS from "../../../utils/constants";

const ISP_URL_BASE = "inSkillProducts";
const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

export default (smapiHandle: SmapiRequest) => {
  function createSkill(manifest: any, vendorId: string, callback: SmapiRequestCallback<string>) {
    const url = "skills/";
    const payload = {
      vendorId,
      manifest: manifest.manifest,
    };
    smapiHandle(
      CONSTANTS.SMAPI.API_NAME.CREATE_SKILL,
      CONSTANTS.HTTP_REQUEST.VERB.POST,
      CONSTANTS.SMAPI.VERSION.V1,
      url,
      EMPTY_QUERY_PARAMS,
      EMPTY_HEADERS,
      payload,
      callback,
    );
  }

  function deleteSkill(skillId: string, callback: SmapiRequestCallback<void>) {
    const url = `skills/${skillId}`;
    smapiHandle(
      CONSTANTS.SMAPI.API_NAME.DELETE_SKILL,
      CONSTANTS.HTTP_REQUEST.VERB.DELETE,
      CONSTANTS.SMAPI.VERSION.V1,
      url,
      EMPTY_QUERY_PARAMS,
      EMPTY_HEADERS,
      NULL_PAYLOAD,
      callback,
    );
  }

  /**
   * List skills based on the vendor-id
   * @param {*} vendorId
   * @param {*} queryParams | nextToken
   *                        | maxResults
   * @param {*} callback
   */
  function listSkills(vendorId: string, queryParams: querystring.ParsedUrlQueryInput, callback: SmapiRequestCallback<any>) {
    let queryObject = R.clone(queryParams);
    if (!queryObject) {
      queryObject = {};
    }
    queryObject.vendorId = vendorId;
    if (queryObject && !queryObject.maxResults) {
      queryObject.maxResults = CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE;
    }
    const url = "skills";
    smapiHandle(
      CONSTANTS.SMAPI.API_NAME.LIST_SKILLS,
      CONSTANTS.HTTP_REQUEST.VERB.GET,
      CONSTANTS.SMAPI.VERSION.V1,
      url,
      queryObject,
      EMPTY_HEADERS,
      NULL_PAYLOAD,
      callback,
    );
  }

  function getSkillStatus(skillId: string, resourcesList: string[], callback: SmapiRequestCallback<any>) {
    let url = `skills/${skillId}/status`;
    if (resourcesList && resourcesList.length !== 0) {
      url += `?${querystring.stringify({resource: resourcesList})}`;
    }
    smapiHandle(
      CONSTANTS.SMAPI.API_NAME.GET_SKILL_STATUS,
      CONSTANTS.HTTP_REQUEST.VERB.GET,
      CONSTANTS.SMAPI.VERSION.V1,
      url,
      EMPTY_QUERY_PARAMS,
      EMPTY_HEADERS,
      NULL_PAYLOAD,
      callback,
    );
  }

  function enableSkill(skillId: string, stage: string, callback: SmapiRequestCallback<void>) {
    const url = `skills/${skillId}/stages/${stage}/enablement`;
    smapiHandle(
      CONSTANTS.SMAPI.API_NAME.ENABLE_SKILL,
      CONSTANTS.HTTP_REQUEST.VERB.PUT,
      CONSTANTS.SMAPI.VERSION.V1,
      url,
      EMPTY_QUERY_PARAMS,
      EMPTY_HEADERS,
      NULL_PAYLOAD,
      callback,
    );
  }

  function disableSkill(skillId: string, stage: string, callback: SmapiRequestCallback<void>) {
    const url = `skills/${skillId}/stages/${stage}/enablement`;
    smapiHandle(
      CONSTANTS.SMAPI.API_NAME.DISABLE_SKILL,
      CONSTANTS.HTTP_REQUEST.VERB.DELETE,
      CONSTANTS.SMAPI.VERSION.V1,
      url,
      EMPTY_QUERY_PARAMS,
      EMPTY_HEADERS,
      NULL_PAYLOAD,
      callback,
    );
  }

  function getSkillEnablement(skillId: string, stage: string): Promise<SmapiResponse<any>>;
  function getSkillEnablement(skillId: string, stage: string, callback: SmapiRequestCallback<any>): void;
  function getSkillEnablement(skillId: string, stage: string, callback?: SmapiRequestCallback<any>): Promise<SmapiResponse<any>> | void {
    const url = `skills/${skillId}/stages/${stage}/enablement`;
    if (callback) {
      return smapiHandle(
        CONSTANTS.SMAPI.API_NAME.GET_SKILL_ENABLEMENT,
        CONSTANTS.HTTP_REQUEST.VERB.GET,
        CONSTANTS.SMAPI.VERSION.V1,
        url,
        EMPTY_QUERY_PARAMS,
        EMPTY_HEADERS,
        NULL_PAYLOAD,
        callback,
      );
    }
    return smapiHandle(
      CONSTANTS.SMAPI.API_NAME.GET_SKILL_ENABLEMENT,
      CONSTANTS.HTTP_REQUEST.VERB.GET,
      CONSTANTS.SMAPI.VERSION.V1,
      url,
      EMPTY_QUERY_PARAMS,
      EMPTY_HEADERS,
      NULL_PAYLOAD,
    );
  }

  function getSkillCredentials(skillId: string, callback: SmapiRequestCallback<any>) {
    const url = `skills/${skillId}/credentials`;
    smapiHandle(
      CONSTANTS.SMAPI.API_NAME.GET_SKILL_CREDENTIALS,
      CONSTANTS.HTTP_REQUEST.VERB.GET,
      CONSTANTS.SMAPI.VERSION.V1,
      url,
      EMPTY_QUERY_PARAMS,
      EMPTY_HEADERS,
      NULL_PAYLOAD,
      callback,
    );
  }

  function validateSkill(skillId: string, stage: string, locales: string, callback: SmapiRequestCallback<any>) {
    const url = `skills/${skillId}/stages/${stage}/validations`;
    const payload = {
      locales: locales.trim().split(/[\s,]+/), // comma or space deliminater regex
    };
    smapiHandle(
      CONSTANTS.SMAPI.API_NAME.VALIDATE_SKILL,
      CONSTANTS.HTTP_REQUEST.VERB.POST,
      CONSTANTS.SMAPI.VERSION.V1,
      url,
      EMPTY_QUERY_PARAMS,
      EMPTY_HEADERS,
      payload,
      callback,
    );
  }

  function getValidation(skillId: string, stage: string, validationId: string, callback: SmapiRequestCallback<any>) {
    const url = `skills/${skillId}/stages/${stage}/validations/${validationId}`;
    smapiHandle(
      CONSTANTS.SMAPI.API_NAME.GET_VALIDATION,
      CONSTANTS.HTTP_REQUEST.VERB.GET,
      CONSTANTS.SMAPI.VERSION.V1,
      url,
      EMPTY_QUERY_PARAMS,
      EMPTY_HEADERS,
      NULL_PAYLOAD,
      callback,
    );
  }

  /**
   * List ISPs based on the skill-id.
   * @param {*} skillId
   * @param {*} stage
   * @param {*} queryParams | nextToken
   *                        | maxResults
   * @param {*} callback
   */
  function listIspForSkill(
    skillId: string,
    stage: string,
    queryParams: querystring.ParsedUrlQueryInput,
    callback: SmapiRequestCallback<any>,
  ) {
    const queryObject = R.clone(queryParams);
    if (queryObject && !queryObject.maxResults) {
      queryObject.maxResults = CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE;
    }
    const url = `skills/${skillId}/stages/${stage}/${ISP_URL_BASE}`;
    smapiHandle(
      CONSTANTS.SMAPI.API_NAME.LIST_ISP_FOR_SKILL,
      CONSTANTS.HTTP_REQUEST.VERB.GET,
      CONSTANTS.SMAPI.VERSION.V1,
      url,
      queryObject,
      EMPTY_HEADERS,
      NULL_PAYLOAD,
      callback,
    );
  }

  /**
   * Get calculated metrics, insights and advanced analytics report for skills usage.
   * @param {String} skillId [required] Unique identifier of skill.
   * @param {String} startTime [required] The start time of query.
   * @param {String} endTime [required] The end time of the query. The maximum duration is one week.
   * @param {Enum} period [required] The aggregation period that is used when retrieving the metric. The values are SINGLE, PT15M, PT1H, P1D.
   * @param {Enum} metric [required] A distinct set of logic that predictably returns a set of data.
   * @param {Enum} stage [required] This parameter shows the stage of the skill. The accepted values are: live or development.
   * @param {Enum} skillType [required] The type of skill. Potential values are: custom, smartHome, or flashBriefing.
   * @param {String} intent The skill intent.
   * @param {String} locale The locale of the skill.
   * @param {String} maxResults The maximum number of results to display per page (100,000 is the maximum number of results).
   * @param {String} nextToken The continuation token returned in response to an object of the last get metrics report response.
   * @param {callback} callback callback function
   */
  function getMetrics(
    skillId: string,
    startTime: string,
    endTime: string,
    period: string,
    metric: string,
    stage: string,
    skillType: string,
    intent: string,
    locale: string,
    maxResults: string,
    nextToken: string,
    callback: SmapiRequestCallback<any>,
  ) {
    const queryObject = {} as any;
    if (startTime) {
      queryObject.startTime = startTime;
    }
    if (endTime) {
      queryObject.endTime = endTime;
    }
    if (period) {
      queryObject.period = period;
    }
    if (metric) {
      queryObject.metric = metric;
    }
    if (stage) {
      queryObject.stage = stage;
    }
    if (skillType) {
      queryObject.skillType = skillType;
    }
    if (intent) {
      queryObject.intent = intent;
    }
    if (locale) {
      queryObject.locale = locale;
    }

    queryObject.maxResults = maxResults || CONSTANTS.SMAPI.DEFAULT_MAX_RESULT_PER_PAGE;

    if (nextToken) {
      queryObject.nextToken = nextToken;
    }

    const url = `skills/${skillId}/metrics`;
    smapiHandle(
      CONSTANTS.SMAPI.API_NAME.GET_METRICS,
      CONSTANTS.HTTP_REQUEST.VERB.GET,
      CONSTANTS.SMAPI.VERSION.V1,
      url,
      queryObject,
      EMPTY_HEADERS,
      NULL_PAYLOAD,
      callback,
    );
  }

  return {
    createSkill,
    deleteSkill,
    listSkills,
    getSkillStatus,
    enableSkill,
    disableSkill,
    getSkillEnablement,
    getSkillCredentials,
    validateSkill,
    getValidation,
    listIspForSkill,
    getMetrics,
  };
};
