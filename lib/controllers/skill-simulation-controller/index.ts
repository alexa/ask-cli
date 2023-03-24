import DialogSaveSkillIoFile from "../../model/dialog-save-skill-io-file";
import SmapiClient, {ISmapiClient, isSmapiError} from "../../clients/smapi-client";
import {RetriableServiceError} from "../../exceptions/cli-retriable-error";
import CliError from "../../exceptions/cli-error";
import {toString} from "../../view/json-view";
import * as CONSTANTS from "../../utils/constants";

export interface SkillSimulationControllerProps {
  skillId: string;
  locale: string;
  stage: string;
  profile: string;
  saveSkillIo: string;
  debug: boolean;
  smapiClient?: ISmapiClient;
}

export class SkillSimulationController {
  protected readonly profile: string;
  protected readonly doDebug: boolean;
  public readonly skillId: string;
  public readonly locale: string;
  public readonly stage: string;
  smapiClient: ISmapiClient;
  skillIOInstance;

  /**
   * Constructor for SkillSimulationController
   * @param {Object} configuration { profile, doDebug }
   * @throws {Error} if configuration is invalid for dialog.
   */
  constructor(configuration: SkillSimulationControllerProps) {
    if (configuration === undefined) {
      throw "Cannot have an undefined configuration.";
    }
    const {skillId, locale, stage, profile, saveSkillIo, debug, smapiClient} = configuration;
    this.profile = profile;
    this.doDebug = debug;
    this.smapiClient =
      smapiClient ||
      new SmapiClient({
        profile: this.profile,
        doDebug: this.doDebug,
      });
    this.skillId = skillId;
    this.locale = locale;
    this.stage = stage;
    this.skillIOInstance = new DialogSaveSkillIoFile(saveSkillIo);
  }

  /**
   * Start skill simulation by calling SMAPI POST skill simulation
   * @param {String} utterance text utterance to simulate against.
   * @param {Boolean} newSession Boolean to specify to FORCE_NEW_SESSION
   */
  async startSkillSimulation(utterance: string, newSession: boolean) {
    this.skillIOInstance.startInvocation({
      utterance,
      newSession,
    });
    try {
      const res = await this.smapiClient.skill.test.simulateSkill(this.skillId, this.stage, utterance, newSession, this.locale);
      if (isSmapiError(res)) {
        throw new RetriableServiceError(toString(res.body), res.body);
      }
      return res;
    } catch (err) {
      if (err instanceof RetriableServiceError) {
        throw err;
      }
      throw new RetriableServiceError(err as string);
    }
  }

  /**
   * Poll for skill simulation results.
   * @todo Implement timeout.
   * @param {String} simulationId simulation ID associated to the current simulation.
   * @param {Function} callback  function to execute upon a response.
   */
  async getSkillSimulationResult(simulationId: string, pollCount?: number): Promise<any> {
    const retryConfig = {
      factor: CONSTANTS.CONFIGURATION.RETRY.GET_SIMULATE_STATUS.FACTOR,
      maxRetry: CONSTANTS.CONFIGURATION.RETRY.GET_SIMULATE_STATUS.MAX_RETRY,
      base: CONSTANTS.CONFIGURATION.RETRY.GET_SIMULATE_STATUS.MIN_TIME_OUT,
    };
    try {
      const res = await this.smapiClient.skill.test.getSimulation(this.skillId, simulationId, this.stage);
      if (isSmapiError(res)) {
        throw new RetriableServiceError(toString(res.body), res.body);
      }
      this.skillIOInstance.endInvocation({
        body: res.body,
      });
      const status = res.body.status;
      if (status === CONSTANTS.SKILL.SIMULATION_STATUS.SUCCESS) {
        return res;
      } else if (status === CONSTANTS.SKILL.SIMULATION_STATUS.FAILURE) {
        throw new RetriableServiceError(`Failed to simulate skill. Error: ${res.body.result.error.message}`, res.body);
      } else {
        if (pollCount && pollCount > retryConfig.maxRetry) {
          throw new CliError(
            !status
              ? `Failed to get status for simulation id: ${simulationId}.` + "Please run again using --debug for more details."
              : "Retry attempt exceeded.",
          );
        } else {
          const retryInterval = retryConfig.base * Math.pow(retryConfig.factor, pollCount ? pollCount : 0);
          await new Promise((resolve) => setTimeout(resolve, retryInterval));
          return this.getSkillSimulationResult(simulationId, (pollCount ? pollCount : 0) + 1);
        }
      }
    } catch (err) {
      if (err instanceof RetriableServiceError) {
        throw err;
      }
      throw new RetriableServiceError(err as string);
    }
  }
}
