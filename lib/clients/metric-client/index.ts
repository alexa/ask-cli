import {v4 as uuid} from "uuid";
import axios, {AxiosInstance} from "axios";
import AppConfig from "../../model/app-config";
import profileHelper from "../../utils/profile-helper";
import {METRICS} from "../../utils/constants";
import pck from "../../../package.json";

export const MetricActionResult: {[RESULT: string]: string} = {
  SUCCESS: "Success",
  FAILURE: "Failure",
};

/**
 * Metric action includes the name and results of CLI command.
 */
export class MetricAction {
  name: string;
  type: string;
  startTime: Date;
  endTime: Date | null;
  result: string | null;
  failureMessage: string;
  id: string;
  _ended: boolean;
  options: string[];
  optionData: {[key: string]: string};

  /**
   * @constructor
   * @param name - The action name.
   * @param type - The action type.
   */
  constructor(name: string, type: string) {
    this.endTime = null;
    this.failureMessage = "";
    this.name = name;
    this.result = null;
    this.startTime = new Date();
    this.type = type;
    this.id = uuid();
    this.options = [];
    this.optionData = {};

    this._ended = false;
  }

  /**
   * Add option to list, store value only if in {@link METRICS.STOREABLE_KEYS}
   * @param optionName name of the option
   * @param optionValue value of the option
   */
  setOption(optionName: string, optionValue: string) {
    const schemaOption = optionName.split("-").join("_");
    this.options.push(schemaOption);

    if (METRICS.STOREABLE_KEYS.includes(schemaOption)) {
      this.optionData[schemaOption] = optionValue;
    }
  }

  /**
   * Closes action
   * @param error Error object or string indicating error.
   */
  end(error: Error | string | null = null) {
    if (this._ended) return;

    // if Error object extract error message,
    // otherwise error message string or null was passed as a parameter
    const errorMessage = error && error instanceof Error ? error.message : error;

    this.result = errorMessage ? MetricActionResult.FAILURE : MetricActionResult.SUCCESS;
    this.failureMessage = errorMessage || "";
    this.endTime = new Date();
    this._ended = true;
  }

  /**
   * Implementation of custom toJSON method to modify serialization with JSON.stringify
   */
  toJSON() {
    return {
      end_time: this.endTime,
      failure_message: this.failureMessage,
      name: this.name,
      result: this.result,
      start_time: this.startTime,
      type: this.type,
      id: this.id,
      options: this.options,
      ...this.optionData,
    };
  }
}

/**
 * Describes the telemetry data sent by the metric client.
 */
interface MetricClientData {
  version: string;
  machineId: string;
  timeStarted: Date;
  newUser: boolean;
  timeUploaded: Date | null;
  clientId: string;
  actions: MetricAction[];
}

/**
 * Client that communicates with telemetry endpoint.
 */
export class MetricClient {
  httpClient: AxiosInstance;
  serverUrl: string;
  postRetries: number;
  enabled: boolean;
  data: MetricClientData;

  /**
   * @constructor
   */
  constructor() {
    this.httpClient = axios.create({
      timeout: 3000,
      headers: {"Content-Type": "text/plain"},
    });
    this.serverUrl = METRICS.ENDPOINT;
    this.postRetries = 3;

    this.enabled = this._isEnabled();

    // initialize data
    this.data = {
      version: pck.version,
      machineId: this._getMachineId(),
      timeStarted: new Date(),
      newUser: false, // default to false since unused.
      timeUploaded: null,
      clientId: pck.name,
      actions: [],
    };
  }

  /**
   * Starts action
   * @param name - The action name
   * @param type - The action type
   * @return the metric action that was started, {@link MetricAction}
   */
  startAction(name: string, type: string): MetricAction {
    const action: MetricAction = new MetricAction(name, type);
    this.data.actions.push(action);
    return action;
  }

  /**
   * Set option for the most recently started action
   * @param optionName name of the option
   * @param optionValue value of the option
   */
  setOption(optionName: string, optionValue: string) {
    const actions = this.data.actions;
    if (actions.length) {
      actions[actions.length - 1].setOption(optionName, optionValue);
    }
  }

  /**
   * Returns current data store in the metric client
   * @return the metric data, {@link MetricClientData}
   */
  getData(): MetricClientData {
    return this.data;
  }

  /**
   * Sends data to the metric server
   * @param error - Error object or string indicating error.
   * @returns whether data was sent successfully
   */
  async sendData(error: Error | string | null = null): Promise<{success: boolean}> {
    if (!this.enabled) {
      this.data.actions = [];
      return {success: true};
    }
    this.data.actions.forEach((action) => action.end(error));
    try {
      await this._upload();
      this.data.actions = [];
      return {success: true};
    } catch {
      return {success: false};
    }
  }

  /**
   * Implementation of custom toJSON method to modify serialization with JSON.stringify
   */
  toJSON() {
    return {
      version: this.data.version,
      machine_id: this.data.machineId,
      time_started: this.data.timeStarted,
      new_user: this.data.newUser,
      time_uploaded: this.data.timeUploaded,
      client_id: this.data.clientId,
      actions: this.data.actions,
    };
  }

  async _upload(): Promise<void> {
    this.data.timeUploaded = new Date();
    const payload = JSON.stringify({payload: this});
    const postPromise = () => this.httpClient.post(this.serverUrl, payload);
    await this._retry(this.postRetries, postPromise);
  }

  async _retry(retries: number, func: any): Promise<void> {
    try {
      await func();
    } catch (error: any) {
      if (retries == 1) throw error;
      await this._retry(retries - 1, func);
    }
  }

  _isEnabled(): boolean {
    if (profileHelper.isEnvProfile()) return true;
    if (process.env.ASK_SHARE_USAGE === "false") return false;
    if (!AppConfig.configFileExists()) return false;

    new AppConfig();
    return AppConfig.getInstance().getShareUsage();
  }

  _getMachineId(): string {
    if (!this.enabled) return "";
    if (profileHelper.isEnvProfile()) return "all_environmental";
    const appConfig = AppConfig.getInstance();
    if (!appConfig.getMachineId()) {
      appConfig.setMachineId(uuid());
      appConfig.write();
    }

    return appConfig.getMachineId();
  }
}
