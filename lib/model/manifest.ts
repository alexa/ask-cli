import ConfigFile from './abstract-config-file';

// instance which stores the singleton
let instance: Manifest | null = null;

export default class Manifest extends ConfigFile {
    /**
     * Constructor for Manifest class
     * @param {string} filePath
     * @throws {Error}
     */
    constructor(filePath: string) {
        if (instance && instance._path === filePath) {
            return instance;
        }
        // init by calling super() if instance not exists
        super(filePath);
        this.read();
        instance = this;
    }

    static getInstance() {
        return instance;
    }

    static dispose() {
        instance = null;
    }

    static get endpointTypes() {
        return {
            EVENTS: 'events',
            APIS: 'apis'
        };
    }

    /**
     * Skill name is decided by en-US locale's name or the first locale's name if en-US doesn't exist
     */
    getSkillName() {
        const publishingLocales = this.getPublishingLocales();
        const finalLocale = publishingLocales['en-US'] ? 'en-US' : Object.keys(publishingLocales)[0];
        return this.getProperty(['manifest', 'publishingInformation', 'locales', finalLocale, 'name']);
    }

    setSkillName(skillName: string) {
        const publishingLocales = this.getPublishingLocales();
        const finalLocale = publishingLocales['en-US'] ? 'en-US' : Object.keys(publishingLocales)[0];
        this.setProperty(['manifest', 'publishingInformation', 'locales', finalLocale, 'name'], skillName);
    }

    // getter and setter

    getPublishingLocales() {
        return this.getProperty(['manifest', 'publishingInformation', 'locales']);
    }

    setPublishingLocales(localesObject: any) {
        this.setProperty(['manifest', 'publishingInformation', 'locales'], localesObject);
    }

    getPublishingLocale(locale: string) {
        return this.getProperty(['manifest', 'publishingInformation', 'locales', locale]);
    }

    setPublishingLocale(locale: string, localeObject: any) {
        this.setProperty(['manifest', 'publishingInformation', 'locales', locale], localeObject);
    }

    getApis() {
        return this.getProperty(['manifest', Manifest.endpointTypes.APIS]);
    }

    setApis(apisObject: any) {
        this.setProperty(['manifest', Manifest.endpointTypes.APIS], apisObject);
    }

    getApisDomain(domain: string) {
        return this.getProperty(['manifest', Manifest.endpointTypes.APIS, domain]);
    }

    setApisDomain(domain: string, domainObject: any) {
        this.setProperty(['manifest', Manifest.endpointTypes.APIS, domain], domainObject);
    }

    getEventsEndpointByRegion(region: string) {
        if (region === 'default') {
            return this.getProperty(['manifest', Manifest.endpointTypes.EVENTS, 'endpoint']);
        }
        return this.getProperty(['manifest', Manifest.endpointTypes.EVENTS, 'regions', region, 'endpoint']);
    }

    setEventsEndpointByRegion(region: string, endpointObj: any) {
        if (region === 'default') {
            this.setProperty(['manifest', Manifest.endpointTypes.EVENTS, 'endpoint'], endpointObj);
        } else {
            this.setProperty(['manifest', Manifest.endpointTypes.EVENTS, 'regions', region, 'endpoint'], endpointObj);
        }
    }

    getApisEndpointByDomainRegion(domain: string, region: string) {
        if (region === 'default') {
            return this.getProperty(['manifest', Manifest.endpointTypes.APIS, domain, 'endpoint']);
        }
        return this.getProperty(['manifest', Manifest.endpointTypes.APIS, domain, 'regions', region, 'endpoint']);
    }

    setApisEndpointByDomainRegion(domain: string, region: string, endpointObj: any) {
        if (region === 'default') {
            this.setProperty(['manifest', Manifest.endpointTypes.APIS, domain, 'endpoint'], endpointObj);
        } else {
            this.setProperty(['manifest', Manifest.endpointTypes.APIS, domain, 'regions', region, 'endpoint'], endpointObj);
        }
    }
};
