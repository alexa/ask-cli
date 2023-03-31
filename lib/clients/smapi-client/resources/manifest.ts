import CONSTANTS from "../../../utils/constants";
import {v1} from "ask-smapi-model";
import {SmapiRequest, SmapiRequestCallback, SmapiResponse} from "..";

const EMPTY_HEADERS = {};
const EMPTY_QUERY_PARAMS = {};
const NULL_PAYLOAD = null;

export default (smapiHandle: SmapiRequest) => {
  function getManifest(skillId: string, stage: string): Promise<SmapiResponse<v1.skill.Manifest.SkillManifestEnvelope>>;
  function getManifest(skillId: string, stage: string, callback: SmapiRequestCallback<v1.skill.Manifest.SkillManifestEnvelope>): void;
  function getManifest(
    skillId: string,
    stage: string,
    callback?: SmapiRequestCallback<v1.skill.Manifest.SkillManifestEnvelope>,
  ): Promise<SmapiResponse<v1.skill.Manifest.SkillManifestEnvelope>> | void {
    const url = `skills/${skillId}/stages/${stage}/manifest`;
    if (callback) {
      return smapiHandle(
        CONSTANTS.SMAPI.API_NAME.GET_MANIFEST,
        CONSTANTS.HTTP_REQUEST.VERB.GET,
        CONSTANTS.SMAPI.VERSION.V1,
        url,
        EMPTY_QUERY_PARAMS,
        EMPTY_HEADERS,
        NULL_PAYLOAD,
        callback,
      );
    } else {
      return smapiHandle(
        CONSTANTS.SMAPI.API_NAME.GET_MANIFEST,
        CONSTANTS.HTTP_REQUEST.VERB.GET,
        CONSTANTS.SMAPI.VERSION.V1,
        url,
        EMPTY_QUERY_PARAMS,
        EMPTY_HEADERS,
        NULL_PAYLOAD,
      );
    }
  }

  function updateManifest(skillId: string, stage: string, manifest: any, eTag: string, callback: SmapiRequestCallback<void>) {
    const url = `skills/${skillId}/stages/${stage}/manifest`;
    const headers = eTag ? {"If-Match": eTag} : {};
    const payload = {manifest: manifest.manifest};
    smapiHandle(
      CONSTANTS.SMAPI.API_NAME.UPDATE_MANIFEST,
      CONSTANTS.HTTP_REQUEST.VERB.PUT,
      CONSTANTS.SMAPI.VERSION.V1,
      url,
      EMPTY_QUERY_PARAMS,
      headers,
      payload,
      callback,
    );
  }

  return {
    getManifest,
    updateManifest,
  };
};
