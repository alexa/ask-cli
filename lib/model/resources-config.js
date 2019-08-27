const fs = require('fs');
const path = require('path');

const ConfigFile = require('./abstract-config-file');

// instance which stores the singleton
let instance = null;

module.exports = class ResourcesConfig extends ConfigFile {
    /**
     * Constructor for ResourcesConfig class
     * @param {string} filePath
     * @throws {Error}
     */
    constructor(filePath) {
        if (instance && instance.path === filePath) {
            return instance;
        }
        // init by calling super() if instance not exists
        super(filePath);
        instance = this;
    }

    static getInstance() {
        return instance;
    }

    static dispose() {
        instance = null;
    }

    // static method to bind the code's build folder path with code src
    getCodeBuildByRegion(profile, region) {
        const codeSrc = this.getProperty(['profiles', profile, 'code', region, 'src']);
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
        return {
            folder: path.join(base, 'build'),
            file: path.join(base, 'build', 'upload.zip')
        };
    }

    // getter and setter

    getProfile(profile) {
        return this.getProperty(['profiles', profile]);
    }

    setProfile(profile, profileObj) {
        this.setProperty(['profiles', profile], profileObj);
    }

    getSkillId(profile) {
        return this.getProperty(['profiles', profile, 'skillId']);
    }

    setSkillId(profile, skillId) {
        this.setProperty(['profiles', profile, 'skillId'], skillId);
    }

    // Group for the "skillMetadata"
    getSkillMetadata(profile) {
        return this.getProperty(['profiles', profile, 'skillMetadata']);
    }

    setSkillMetadata(profile, skillMetadataObject) {
        this.setProperty(['profiles', profile, 'skillMetadata'], skillMetadataObject);
    }

    getSkillMetaSrc(profile) {
        return this.getProperty(['profiles', profile, 'skillMetadata', 'src']);
    }

    setSkillMetaSrc(profile, skillMetaSrc) {
        this.setProperty(['profiles', profile, 'skillMetadata', 'src'], skillMetaSrc);
    }

    getSkillMetaLastDeployHash(profile) {
        return this.getProperty(['profiles', profile, 'skillMetadata', 'lastDeployHash']);
    }

    setSkillMetaLastDeployHash(profile, lastDeployHash) {
        this.setProperty(['profiles', profile, 'skillMetadata', 'lastDeployHash'], lastDeployHash);
    }

    // Group for the "code"
    getCode(profile) {
        return this.getProperty(['profiles', profile, 'code']);
    }

    setCode(profile, code) {
        this.setProperty(['profiles', profile, 'code'], code);
    }

    getCodeByRegion(profile, region) {
        return this.getProperty(['profiles', profile, 'code', region]);
    }

    setCodeByRegion(profile, region, code) {
        this.setProperty(['profiles', profile, 'code', region], code);
    }

    getCodeSrcByRegion(profile, region) {
        return this.getProperty(['profiles', profile, 'code', region, 'src']);
    }

    setCodeSrcByRegion(profile, region, src) {
        this.setProperty(['profiles', profile, 'code', region, 'src'], src);
    }

    getCodeLastDeployHashByRegion(profile, region) {
        return this.getProperty(['profiles', profile, 'code', region, 'lastDeployHash']);
    }

    setCodeLastDeployHashByRegion(profile, region, hash) {
        this.setProperty(['profiles', profile, 'code', region, 'lastDeployHash'], hash);
    }

    // Group for the "skillInfrastructure"
    getSkillInfra(profile) {
        return this.getProperty(['profiles', profile, 'skillInfrastructure']);
    }

    setSkillInfra(profile, skillInfrastructureObject) {
        this.setProperty(['profiles', profile, 'skillInfrastructure'], skillInfrastructureObject);
    }

    getSkillInfraType(profile) {
        return this.getProperty(['profiles', profile, 'skillInfrastructure', 'type']);
    }

    setSkillInfraType(profile, type) {
        this.setProperty(['profiles', profile, 'skillInfrastructure', 'type'], type);
    }

    getSkillInfraUserConfig(profile) {
        return this.getProperty(['profiles', profile, 'skillInfrastructure', 'userConfig']);
    }

    setSkillInfraUserConfig(profile, userConfig) {
        this.setProperty(['profiles', profile, 'skillInfrastructure', 'userConfig'], userConfig);
    }

    getSkillInfraDeployState(profile) {
        return this.getProperty(['profiles', profile, 'skillInfrastructure', 'deployState']);
    }

    setSkillInfraDeployState(profile, deployState) {
        this.setProperty(['profiles', profile, 'skillInfrastructure', 'deployState'], deployState);
    }
};
