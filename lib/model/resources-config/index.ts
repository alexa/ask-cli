import fs from 'fs-extra';
import path from 'path';

import * as CONSTANTS from '@src/utils/constants';

import AskResources from './ask-resources';
import AskStates from './ask-states';

// instance which stores the singleton
let instance: ResourcesConfig | null = null;

const getAskResources = () => AskResources.getInstance() as AskResources;
const getAskStates = () => AskStates.getInstance() as AskStates;

export const BASE: any = {
    askcliResourcesVersion: '2020-03-31',
    profiles: {}
};

export default class ResourcesConfig {
    private _askResourcesPath: string = "";
    private _projectRootPath?: string;
    private _askStatesPath?: string;

    constructor(askResourcesPath: string) {
        if (instance && instance._askResourcesPath === askResourcesPath) {
            return instance;
        }
        this._askResourcesPath = askResourcesPath;
        this._projectRootPath = path.dirname(askResourcesPath);
        this._askStatesPath = path.join(
            this._projectRootPath, CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER, CONSTANTS.FILE_PATH.ASK_STATES_JSON_CONFIG
        );
        this._loadModel();
        instance = this;
    }

    /**
     * When instantiating ResourcesConfig, AskResources must exist, AskStates will automatically be created.
     */
    _loadModel() {
        // instantiate ask-resources first to make sure the file does exist
        new AskResources(this._askResourcesPath);
        const str: string = this._askStatesPath as string;
        // ensure ask-states will exist
        if (!fs.existsSync(str)) {
            AskStates.withContent(str);
        } else {
            new AskStates(str);
        }
    }

    static getInstance() {
        return instance;
    }

    static dispose() {
        AskResources.dispose();
        AskStates.dispose();
        instance = null;
    }

    write() {
        getAskResources().write();
        getAskStates().write();
    }

    // getter and setter

    getProfile(profile: string) {
        return getAskResources().getProfile(profile);
    }

    setProfile(profile: string, profileObj: any) {
        getAskResources().setProfile(profile, profileObj);
    }

    getSkillId(profile: string) {
        return getAskStates().getSkillId(profile);
    }

    setSkillId(profile: string, skillId: string) {
        getAskStates().setSkillId(profile, skillId);
    }

    // Group for the "skillMetadata"
    getSkillMetaSrc(profile: string) {
        return getAskResources().getSkillMetaSrc(profile);
    }

    setSkillMetaSrc(profile: string, skillMetaSrc: string) {
        getAskResources().setSkillMetaSrc(profile, skillMetaSrc);
    }

    getSkillMetaLastDeployHash(profile: string) {
        return getAskStates().getSkillMetaLastDeployHash(profile);
    }

    setSkillMetaLastDeployHash(profile: string, lastDeployHash: string) {
        getAskStates().setSkillMetaLastDeployHash(profile, lastDeployHash);
    }

    // Group for the "code"
    getCodeSrcByRegion(profile: string, region: string) {
        return getAskResources().getCodeSrcByRegion(profile, region);
    }

    setCodeSrcByRegion(profile: string, region: string, src: string) {
        getAskResources().setCodeSrcByRegion(profile, region, src);
    }

    getCodeLastDeployHashByRegion(profile: string, region: string) {
        return getAskStates().getCodeLastDeployHashByRegion(profile, region);
    }

    setCodeLastDeployHashByRegion(profile: string, region: string, hash: string) {
        getAskStates().setCodeLastDeployHashByRegion(profile, region, hash);
    }

    getCodeRegions(profile: string) {
        return getAskResources().getCodeRegions(profile);
    }

    getCodeBuildByRegion(profile: string, region: string) {
        const projectRootPath = this._projectRootPath as string;
        const codeSrc = this.getCodeSrcByRegion(profile, region);
        return getAskStates().getCodeBuildByRegion(projectRootPath, codeSrc);
    }

    getTargetEndpoints(profile: string) {
        return getAskResources().getTargetEndpoint(profile);
    }

    // Group for the "skillInfrastructure"
    getSkillInfraType(profile: string) {
        return getAskResources().getSkillInfraType(profile);
    }

    setSkillInfraType(profile: string, type: string) {
        getAskResources().setSkillInfraType(profile, type);
    }

    getSkillInfraUserConfig(profile: string) {
        return getAskResources().getSkillInfraUserConfig(profile);
    }

    setSkillInfraUserConfig(profile: string, userConfig: any) {
        getAskResources().setSkillInfraUserConfig(profile, userConfig);
    }

    getSkillInfraDeployState(profile: string) {
        const infraType = this.getSkillInfraType(profile);
        return getAskStates().getSkillInfraDeployState(profile, infraType);
    }

    setSkillInfraDeployState(profile: string, deployState: string) {
        const infraType = this.getSkillInfraType(profile);
        getAskStates().setSkillInfraDeployState(profile, infraType, deployState);
    }
};
