const ConfigFile = require('./abstract-config-file');

// instance which stores the singleton
let instance = null;

module.exports = class Manifest extends ConfigFile {
    /**
     * Constructor for Manifest class
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

    static getInstance() {
        return instance;
    }

    static dispose() {
        instance = null;
    }

    /**
     * Skill name is decided by en-US locale's name or the first locale's name if en-US doesn't exist
     */
    getSkillName() {
        const publishingLocales = this.getPublishingLocales();
        const finalLocale = publishingLocales['en-US'] ? 'en-US' : Object.keys(publishingLocales)[0];
        return this.getProperty(['manifest', 'publishingInformation', 'locales', finalLocale, 'name']);
    }

    setSkillName(skillName) {
        const publishingLocales = this.getPublishingLocales();
        const finalLocale = publishingLocales['en-US'] ? 'en-US' : Object.keys(publishingLocales)[0];
        this.setProperty(['manifest', 'publishingInformation', 'locales', finalLocale, 'name'], skillName);
    }

    // getter and setter

    getPublishingLocales() {
        return this.getProperty(['manifest', 'publishingInformation', 'locales']);
    }

    setPublishingLocales(localesObject) {
        this.setProperty(['manifest', 'publishingInformation', 'locales'], localesObject);
    }

    getPublishingLocale(locale) {
        return this.getProperty(['manifest', 'publishingInformation', 'locales', locale]);
    }

    setPublishingLocale(locale, localeObject) {
        this.setProperty(['manifest', 'publishingInformation', 'locales', locale], localeObject);
    }

    getApis() {
        return this.getProperty(['manifest', 'apis']);
    }

    setApis(apisObject) {
        this.setProperty(['manifest', 'apis'], apisObject);
    }

    getApisDomain(domain) {
        return this.getProperty(['manifest', 'apis', domain]);
    }

    setApisDomain(domain, domainObject) {
        this.setProperty(['manifest', 'apis', domain], domainObject);
    }

    getApisEndpointByDomainRegion(domain, region) {
        if (region === 'default') {
            return this.getProperty(['manifest', 'apis', domain, 'endpoint']);
        }
        return this.getProperty(['manifest', 'apis', domain, 'regions', region, 'endpoint']);
    }

    setApisEndpointByDomainRegion(domain, region, endpointObj) {
        if (region === 'default') {
            this.setProperty(['manifest', 'apis', domain, 'endpoint'], endpointObj);
        } else {
            this.setProperty(['manifest', 'apis', domain, 'regions', region, 'endpoint'], endpointObj);
        }
    }
};
