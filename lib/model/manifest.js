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
        return this.getProperty(['manifest', Manifest.endpointTypes.APIS]);
    }

    setApis(apisObject) {
        this.setProperty(['manifest', Manifest.endpointTypes.APIS], apisObject);
    }

    getApisDomain(domain) {
        return this.getProperty(['manifest', Manifest.endpointTypes.APIS, domain]);
    }

    setApisDomain(domain, domainObject) {
        this.setProperty(['manifest', Manifest.endpointTypes.APIS, domain], domainObject);
    }

    getEventsEndpointByRegion(region) {
        if (region === 'default') {
            return this.getProperty(['manifest', Manifest.endpointTypes.EVENTS, 'endpoint']);
        }
        return this.getProperty(['manifest', Manifest.endpointTypes.EVENTS, 'regions', region, 'endpoint']);
    }

    setEventsEndpointByRegion(region, endpointObj) {
        if (region === 'default') {
            this.setProperty(['manifest', Manifest.endpointTypes.EVENTS, 'endpoint'], endpointObj);
        } else {
            this.setProperty(['manifest', Manifest.endpointTypes.EVENTS, 'regions', region, 'endpoint'], endpointObj);
        }
    }

    getApisEndpointByDomainRegion(domain, region) {
        if (region === 'default') {
            return this.getProperty(['manifest', Manifest.endpointTypes.APIS, domain, 'endpoint']);
        }
        return this.getProperty(['manifest', Manifest.endpointTypes.APIS, domain, 'regions', region, 'endpoint']);
    }

    setApisEndpointByDomainRegion(domain, region, endpointObj) {
        if (region === 'default') {
            this.setProperty(['manifest', Manifest.endpointTypes.APIS, domain, 'endpoint'], endpointObj);
        } else {
            this.setProperty(['manifest', Manifest.endpointTypes.APIS, domain, 'regions', region, 'endpoint'], endpointObj);
        }
    }

    getEventsPublications() {
        return this.getProperty(['manifest', Manifest.endpointTypes.EVENTS, 'publications']);
    }

    setEventsPublications(publications) {
        this.setProperty(['manifest', Manifest.endpointTypes.EVENTS, 'publications'], publications);
    }

    getEventsSubscriptions() {
        return this.getProperty(['manifest', Manifest.endpointTypes.EVENTS, 'subscriptions']);
    }

    setEventsSubscriptions(subscriptions) {
        this.setProperty(['manifest', Manifest.endpointTypes.EVENTS, 'subscriptions'], subscriptions);
    }
};
