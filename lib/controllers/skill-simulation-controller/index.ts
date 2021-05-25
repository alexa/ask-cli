import R from 'ramda';
import DialogSaveSkillIoFile from '@src/model/dialog-save-skill-io-file';
import SmapiClient from '@src/clients/smapi-client';
import jsonView from '@src/view/json-view';
import * as CONSTANTS from '@src/utils/constants';
import { retry } from '@src/utils/retry-utility';

export interface ISkillSimulationController {
    skillId: any;
    locale: string;
    stage: string;
    profile: string;
    saveSkillIo: string;
    debug: boolean;
    smapiClient?: SmapiClient;
};

export default class SkillSimulationController {
    private _profile: string;
    private _doDebug: boolean;
    private _smapiClient: any;
    protected _skillId: any;
    protected _locale: string;
    private _stage: string;
    protected _skillIOInstance: DialogSaveSkillIoFile;

    /**
     * Constructor for SkillSimulationController
     * @param {Object} configuration { profile, doDebug }
     * @throws {Error} if configuration is invalid for dialog.
     */
    constructor(configuration: ISkillSimulationController) {
        if (configuration === undefined) {
            throw 'Cannot have an undefined configuration.';
        }
        const { skillId, locale, stage, profile, saveSkillIo, debug, smapiClient } = configuration;
        this._profile = profile;
        this._doDebug = debug;
        this._smapiClient = smapiClient || new SmapiClient({ profile: this._profile, doDebug: this._doDebug });
        this._skillId = skillId;
        this._locale = locale;
        this._stage = stage;
        this._skillIOInstance = new DialogSaveSkillIoFile(saveSkillIo);
    }

    /**
     * Start skill simulation by calling SMAPI POST skill simulation
     * @param {String} utterance text utterance to simulate against.
     * @param {Boolean} newSession Boolean to specify to FORCE_NEW_SESSION
     * @param {Function} callback callback to execute upon a response.
     */
    startSkillSimulation(utterance: string, newSession: boolean, callback: Function) {
        this._skillIOInstance.startInvocation({ utterance, newSession });
        (this._smapiClient.skill as any).test.simulateSkill(this._skillId, this._stage, utterance, newSession, this._locale, (err?: Error, res?: any) => {
            if (err) {
                return callback(err);
            }
            if (res.statusCode >= 300) {
                return callback(jsonView.toString(res.body));
            }
            callback(err, res);
        });
    }

    /**
     * Poll for skill simulation results.
     * @todo Implement timeout.
     * @param {String} simulationId simulation ID associated to the current simulation.
     * @param {Function} callback  function to execute upon a response.
     */
    getSkillSimulationResult(simulationId: string, callback: Function) {
        const retryConfig = {
            factor: CONSTANTS.CONFIGURATION.RETRY.GET_SIMULATE_STATUS.FACTOR,
            maxRetry: CONSTANTS.CONFIGURATION.RETRY.GET_SIMULATE_STATUS.MAX_RETRY,
            base: CONSTANTS.CONFIGURATION.RETRY.GET_SIMULATE_STATUS.MIN_TIME_OUT
        };
        const retryCall = (loopCallback: Function) => {
            this._smapiClient.skill.test.getSimulation(this._skillId, simulationId, this._stage, (pollErr?: Error, pollResponse?: any) => {
                if (pollErr) {
                    return loopCallback(pollErr);
                }
                if (pollResponse.statusCode >= 300) {
                    return loopCallback(jsonView.toString(pollResponse.body));
                }
                loopCallback(null, pollResponse);
            });
        };
        const shouldRetryCondition = (retryResponse: any) => {
            const status = R.view(R.lensPath(['body', 'status']), retryResponse);
            return !status || status === CONSTANTS.SKILL.SIMULATION_STATUS.IN_PROGRESS;
        };
        retry(retryConfig, retryCall, shouldRetryCondition, (err?: Error, res?: any) => {
            if (err) {
                return callback(err);
            }
            this._skillIOInstance.endInvocation({ body: res.body });
            if (!res.body.status) {
                return callback(`Failed to get status for simulation id: ${simulationId}.`
                    + 'Please run again using --debug for more details.');
            }
            return callback(null, res);
        });
    }
};
