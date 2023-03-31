import {SmapiRequest, SmapiRequestCallback, SmapiResponse} from "..";
import CONSTANTS from "../../../utils/constants";

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

export default (smapiHandle: SmapiRequest) => {
  function invokeSkill(skillId: string, stage: string, invokePayload: any, endpointRegion: string, callback: SmapiRequestCallback<any>) {
    const url = `skills/${skillId}/stages/${stage}/invocations`;
    const payload = {
      endpointRegion,
      skillRequest: invokePayload,
    };
    smapiHandle(
      CONSTANTS.SMAPI.API_NAME.INVOKE_SKILL,
      CONSTANTS.HTTP_REQUEST.VERB.POST,
      CONSTANTS.SMAPI.VERSION.V2,
      url,
      EMPTY_QUERY_PARAMS,
      EMPTY_HEADERS,
      payload,
      callback,
    );
  }

  function simulateSkill(skillId: string, stage: string, input: string, newSession: boolean, locale: string): Promise<SmapiResponse<any>>;
  function simulateSkill(
    skillId: string,
    stage: string,
    input: string,
    newSession: boolean,
    locale: string,
    callback: SmapiRequestCallback<any>,
  ): void;
  function simulateSkill(
    skillId: string,
    stage: string,
    input: string,
    newSession: boolean,
    locale: string,
    callback?: SmapiRequestCallback<any>,
  ): Promise<SmapiResponse<any>> | void {
    const url = `skills/${skillId}/stages/${stage}/simulations`;
    const payload = {
      input: {
        content: input,
      },
      device: {
        locale,
      },
      ...(newSession
        ? {
            session: {
              mode: "FORCE_NEW_SESSION",
            },
          }
        : {}),
    };
    if (callback) {
      return smapiHandle(
        CONSTANTS.SMAPI.API_NAME.SIMULATE_SKILL,
        CONSTANTS.HTTP_REQUEST.VERB.POST,
        CONSTANTS.SMAPI.VERSION.V2,
        url,
        EMPTY_QUERY_PARAMS,
        EMPTY_HEADERS,
        payload,
        callback,
      );
    }
    return smapiHandle(
      CONSTANTS.SMAPI.API_NAME.SIMULATE_SKILL,
      CONSTANTS.HTTP_REQUEST.VERB.POST,
      CONSTANTS.SMAPI.VERSION.V2,
      url,
      EMPTY_QUERY_PARAMS,
      EMPTY_HEADERS,
      payload,
    );
  }

  function getSimulation(skillId: string, simulationId: string, stage: string): Promise<SmapiResponse<any>>;
  function getSimulation(skillId: string, simulationId: string, stage: string, callback: SmapiRequestCallback<any>): void;
  function getSimulation(skillId: string, simulationId: string, stage: string, callback?: SmapiRequestCallback<any>) {
    const url = `skills/${skillId}/stages/${stage}/simulations/${simulationId}`;
    if (callback) {
      return smapiHandle(
        CONSTANTS.SMAPI.API_NAME.GET_SIMULATION,
        CONSTANTS.HTTP_REQUEST.VERB.GET,
        CONSTANTS.SMAPI.VERSION.V2,
        url,
        EMPTY_QUERY_PARAMS,
        EMPTY_HEADERS,
        NULL_PAYLOAD,
        callback,
      );
    }
    return smapiHandle(
      CONSTANTS.SMAPI.API_NAME.GET_SIMULATION,
      CONSTANTS.HTTP_REQUEST.VERB.GET,
      CONSTANTS.SMAPI.VERSION.V2,
      url,
      EMPTY_QUERY_PARAMS,
      EMPTY_HEADERS,
      NULL_PAYLOAD,
    );
  }

  function modifyLastTurn(params: ModifyLastTurnParams): Promise<SmapiResponse<any, ModifyLastTurnError>>;
  function modifyLastTurn(params: ModifyLastTurnParams, callback: SmapiRequestCallback<SmapiResponse<any, ModifyLastTurnError>>): void;
  function modifyLastTurn(
    params: ModifyLastTurnParams,
    callback?: SmapiRequestCallback<SmapiResponse<any, ModifyLastTurnError>>,
  ): Promise<SmapiResponse<any, ModifyLastTurnError>> | void {
    const url = `skills/${params.skillId}/stages/${params.stage}/locales/${params.locale}/conversations/turnPredictions`;
    if (callback) {
      return smapiHandle(
        CONSTANTS.SMAPI.API_NAME.MODIFY_LAST_TURN,
        CONSTANTS.HTTP_REQUEST.VERB.PUT,
        CONSTANTS.SMAPI.VERSION.V1,
        url,
        EMPTY_QUERY_PARAMS,
        EMPTY_HEADERS,
        params.payload,
        callback,
      );
    }
    return smapiHandle(
      CONSTANTS.SMAPI.API_NAME.MODIFY_LAST_TURN,
      CONSTANTS.HTTP_REQUEST.VERB.PUT,
      CONSTANTS.SMAPI.VERSION.V1,
      url,
      EMPTY_QUERY_PARAMS,
      EMPTY_HEADERS,
      params.payload,
    );
  }

  return {
    invokeSkill,
    simulateSkill,
    getSimulation,
    modifyLastTurn,
  };
};

export interface CorrectionPayload {
  endPrediction: boolean;
  corrections: any[];
}

export interface ModifyLastTurnParams {
  skillId: string;
  stage: string;
  locale: string;
  payload: CorrectionPayload;
}

export interface ModifyLastTurnError {
  violations: {message: string}[];
}
