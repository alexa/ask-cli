import {ApiClient, ApiClientRequest, ApiClientResponse} from "ask-sdk-model-runtime";

import {SmapiResponse} from ".";
import * as httpClient from "../http-client";

/**
 * Implementation of {@link ApiClient} that leverages the httpclient class which supports setting Proxies and publishing telemetry metrics.
 * This is use while building a CustomSmapiClientBuilder instead of using the DefaultApiClient
 */
export class SmapiApiClient implements ApiClient {
  doDebug: boolean;
  profile: string;
  fullResponse: boolean;

  /**
   * Builds an instance of the SmapiApiClient class
   * @param doDebug Set to true to tell the httpClient to print request information to the terminal
   * @param profile The configured ask profile to use for authorization
   * @param fullResponse Set to true to tell the httpClient to print the full response from the service
   */
  constructor(doDebug: boolean, profile: string, fullResponse: boolean) {
    this.doDebug = doDebug;
    this.profile = profile;
    this.fullResponse = fullResponse;
  }

  /**
   * Dispatches a request to an API endpoint described in the request.
   * @param {ApiClientRequest} request request to dispatch to the ApiClient
   * @returns {Promise<ApiClientResponse>} response from the ApiClient
   */
  public invoke(request: ApiClientRequest): Promise<ApiClientResponse> {
    return new Promise<ApiClientResponse>(async (resolve, reject) => {
      const headers: {[key: string]: string} = {};
      let data: any = request.body;
      request.headers?.forEach(header => {
        if (header.key.toLowerCase() === "content-type" &&
          header.value.toLowerCase() === "application/x-www-form-urlencoded") {
          data = this.convertUrlEncodedToJson(request.body);
          headers[header.key] = "application/json";
        } else {
          headers[header.key] = header.value;
        }
      });

      const requestOptions = {
        url: request.url,
        method: request.method,
        headers: headers,
        body: data,
      };

      httpClient.request(requestOptions, "SMAPI_API_CLIENT", this.doDebug, (reqErr: any, reqResponse: SmapiResponse<any>) => {
        if (reqErr) {
          return reject(new Error(reqErr));
        }
        const dataContent = reqResponse?.body || {};

        resolve({
          statusCode: reqResponse?.statusCode!,
          body: this.sanitizeDataContent(dataContent),
          headers: reqResponse?.headers!,
        });
      });
    });
  }

  private convertUrlEncodedToJson(urlEncoded: string | undefined): {[key: string]: string}  {
    var result: {[key: string]: string} = {};
    urlEncoded?.split('&').forEach(function(entry) {
      const keyValueSplit = entry.split('=');
      if (keyValueSplit && keyValueSplit.length > 1) {
        result[keyValueSplit[0]] = decodeURIComponent(keyValueSplit[1] || '');
      }
    });
    return result;
  }

  private sanitizeDataContent(dataContent: object): string {
    return JSON.stringify(dataContent, (k, v) => { if (k !== "_links") return v; });
  }

}
