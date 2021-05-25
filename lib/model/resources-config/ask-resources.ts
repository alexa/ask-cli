import ConfigFile from '../abstract-config-file';

// instance which stores the singleton
let instance: AskResources | null = null;

export const BASE = {
    askcliResourcesVersion: '2020-03-31',
    profiles: {}
};

const FILE_NOT_FOUND_HINT_MESSAGE = ' If this is a skill project managed by v1 ask-cli, '
+ 'please run \'ask util upgrade-project\' then try the command again.';

export default class AskResources extends ConfigFile {
    /**
     * Constructor for AskResources class
     * @param {string} filePath
     * @throws {Error}
     */
    constructor(filePath: string) {
        if (instance && instance._path === filePath) {
            return instance;
        }
        // init by calling super() if instance not exists
        super(filePath);
        this._fileNotFoundHintMessage = FILE_NOT_FOUND_HINT_MESSAGE;
        this.read();
        instance = this;
    }

    static withContent(filePath: string, content: any = BASE) {
        super.withContent(filePath, content);
        new AskResources(filePath);
    }

    static getInstance() {
        return instance;
    }

    static dispose() {
        instance = null;
    }

    // getter and setter

    getProfile(profile: string) {
        return this.getProperty(['profiles', profile]);
    }

    setProfile(profile: string, profileObj: any) {
        this.setProperty(['profiles', profile], profileObj);
    }

    // Group for the "skillMetadata"
    getSkillMetaSrc(profile: string) {
        return this.getProperty(['profiles', profile, 'skillMetadata', 'src']);
    }

    setSkillMetaSrc(profile: string, skillMetaSrc: any) {
        this.setProperty(['profiles', profile, 'skillMetadata', 'src'], skillMetaSrc);
    }

    // Group for the "code"
    getCodeRegions(profile: string) {
        return Object.keys(this.getProperty(['profiles', profile, 'code']) || []);
    }

    getCodeSrcByRegion(profile: string, region: string) {
        return this.getProperty(['profiles', profile, 'code', region, 'src']);
    }

    setCodeSrcByRegion(profile: string, region: string, src: any) {
        this.setProperty(['profiles', profile, 'code', region, 'src'], src);
    }

    // Group for the "skillInfrastructure"
    getSkillInfraType(profile: string) {
        return this.getProperty(['profiles', profile, 'skillInfrastructure', 'type']);
    }

    setSkillInfraType(profile: string, type: string) {
        this.setProperty(['profiles', profile, 'skillInfrastructure', 'type'], type);
    }

    getSkillInfraUserConfig(profile: string) {
        return this.getProperty(['profiles', profile, 'skillInfrastructure', 'userConfig']);
    }

    setSkillInfraUserConfig(profile: string, userConfig: string) {
        this.setProperty(['profiles', profile, 'skillInfrastructure', 'userConfig'], userConfig);
    }

    getTargetEndpoint(profile: string) {
        return this.getProperty(['profiles', profile, 'skillInfrastructure', 'userConfig', 'targetEndpoint']) || [];
    }
};
