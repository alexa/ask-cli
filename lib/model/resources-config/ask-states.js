const fs = require('fs-extra');
const path = require('path');

const CONSTANTS = require('@src/utils/constants');

const ConfigFile = require('../abstract-config-file');

// instance which stores the singleton
let instance = null;

const BASE = {
    askcliStatesVersion: '2020-03-31',
    profiles: {}
};

module.exports = class AskStates extends ConfigFile {
    /**
     * Constructor for AskStates class
     * @param {string} filePath
     * @throws {Error}
     */
    constructor(filePath) {
        if (instance && instance.path === filePath) {
            return instance;
        }
        // init by calling super() if instance not exists
        super(filePath);
        this.read();
        instance = this;
    }

    static withContent(filePath, content = BASE) {
        super.withContent(filePath, content);
        new AskStates(filePath);
    }

    static getInstance() {
        return instance;
    }

    static dispose() {
        instance = null;
    }

    // getter and setter

    getSkillId(profile) {
        return this.getProperty(['profiles', profile, 'skillId']);
    }

    setSkillId(profile, skillId) {
        this.setProperty(['profiles', profile, 'skillId'], skillId);
    }

    // Group for the "skillMetadata"
    getSkillMetaLastDeployHash(profile) {
        return this.getProperty(['profiles', profile, 'skillMetadata', 'lastDeployHash']);
    }

    setSkillMetaLastDeployHash(profile, lastDeployHash) {
        this.setProperty(['profiles', profile, 'skillMetadata', 'lastDeployHash'], lastDeployHash);
    }

    // Group for the "code"
    getCodeLastDeployHashByRegion(profile, region) {
        return this.getProperty(['profiles', profile, 'code', region, 'lastDeployHash']);
    }

    setCodeLastDeployHashByRegion(profile, region, hash) {
        this.setProperty(['profiles', profile, 'code', region, 'lastDeployHash'], hash);
    }

    getCodeBuildByRegion(projRoot, codeSrc) {
        if (!codeSrc) {
            return null;
        }
        /**
         * Resolve the base path for build folder:
         *   if src is a folder, direct add build folder inside of it;
         *   if src is a file, use the path to the folder it's located as base folder.
         */
        const base = path.resolve(
            fs.statSync(codeSrc).isDirectory() ? codeSrc : codeSrc.replace(path.basename(codeSrc), '')
        );
        const mirrorPath = path.relative(projRoot, base);
        return {
            folder: path.join(projRoot, CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER, mirrorPath),
            file: path.join(projRoot, CONSTANTS.FILE_PATH.HIDDEN_ASK_FOLDER, mirrorPath, 'build.zip')
        };
    }

    // Group for the "skillInfrastructure"
    getSkillInfraDeployState(profile, infraType) {
        return this.getProperty(['profiles', profile, 'skillInfrastructure', infraType, 'deployState']);
    }

    setSkillInfraDeployState(profile, infraType, deployState) {
        this.setProperty(['profiles', profile, 'skillInfrastructure', infraType, 'deployState'], deployState);
    }
};

module.exports.BASE = BASE;
