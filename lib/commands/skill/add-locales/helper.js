const fs = require('fs-extra');
const path = require('path');
const R = require('ramda');
const async = require('async');

const httpClient = require('@src/clients/http-client');
const SkillMetadataController = require('@src/controllers/skill-metadata-controller');
const CliError = require('@src/exceptions/cli-error');
const ResourcesConfig = require('@src/model/resources-config');
const Manifest = require('@src/model/manifest');
const stringUtils = require('@src/utils/string-utils');
const CONSTANTS = require('@src/utils/constants');

module.exports = {
    initiateModels,
    addLocales
};

/**
 * Start with loading the project Models global instances.
 * @param {String} profile
 */
function initiateModels(profile) {
    new ResourcesConfig(path.join(process.cwd(), CONSTANTS.FILE_PATH.ASK_RESOURCES_JSON_CONFIG));
    const skillPackageSrc = ResourcesConfig.getInstance().getSkillMetaSrc(profile);
    if (!stringUtils.isNonBlankString(skillPackageSrc)) {
        throw new CliError('Skill package src is not found in ask-resources.json.');
    }
    if (!fs.existsSync(skillPackageSrc)) {
        throw new CliError(`The skillMetadata src file ${skillPackageSrc} does not exist.`);
    }
    const manifestPath = path.join(skillPackageSrc, CONSTANTS.FILE_PATH.SKILL_PACKAGE.MANIFEST);
    new Manifest(manifestPath);
}

/**
 * Add locales by deciding where to get the source of interaction models,
 * and commit the copy paste from the source to the target location.
 *
 * @param {Array} selectedLocales
 * @param {String} profile
 * @param {Boolean} doDebug
 * @param {Function} callback
 */
function addLocales(selectedLocales, profile, doDebug, callback) {
    // analyze all the selected locales, whether copy from local existing files or get from remote templates
    _getNewLocaleModelUri(selectedLocales, profile, doDebug, (resolveErr, iModelSourceByLocales) => {
        if (resolveErr) {
            return callback(resolveErr);
        }
        const iModelFolderPath = path.join(process.cwd(), ResourcesConfig.getInstance().getSkillMetaSrc(profile),
            CONSTANTS.FILE_PATH.SKILL_PACKAGE.INTERACTION_MODEL, 'custom');
        const remoteTemplateSet = new Set(
            [...iModelSourceByLocales.values()].reduce((acc, cur) => {
                if (!cur.canCopy) { acc.push(cur.uri); }
                return acc;
            }, [])
        );
        // retrieve remote templates when no existing JSON shares the same language
        _retrieveTemplatesByLanguage(remoteTemplateSet, doDebug, (templateErr, templateByLanguage) => {
            if (templateErr) {
                return callback(templateErr);
            }
            // copy iModel JSONs that contains same language
            iModelSourceByLocales.forEach((v, k) => {
                if (v.canCopy) {
                    const sourceLocale = path.basename(v.uri, path.extname(v.uri));
                    const targetFilePath = path.join(iModelFolderPath, `${k}.json`);
                    fs.copySync(v.uri, targetFilePath); // do not fail if the target locale exists already
                    const sourceManifestLocale = Manifest.getInstance().getPublishingLocale(sourceLocale);
                    Manifest.getInstance().setPublishingLocale(k, sourceManifestLocale);
                } else {
                    const targetFilePath = path.join(iModelFolderPath, `${k}.json`);
                    fs.writeFileSync(targetFilePath, templateByLanguage.get(v.uri), { encoding: 'utf-8' });
                    Manifest.getInstance().setPublishingLocale(k, { name: 'please change' });
                }
            });
            Manifest.getInstance().write();
            callback(undefined, iModelSourceByLocales);
        });
    });
}

/**
 * Based on user's selected locales, and the local project's iModel files, decide where to get the
 * iModel file to add in user's local project. Exclude reusableLocales themselves from the result.
 *
 * @param {Array} selectedLocales
 * @param {String} profile
 * @param {Boolean} doDebug
 * @returns {Function} callback Map { locale: { uri, canCopy} } where the uri is filePath or remoteURI
 */
function _getNewLocaleModelUri(selectedLocales, profile, doDebug, callback) {
    const skillMetaController = new SkillMetadataController({ profile, doDebug });
    const localIModelByLocale = skillMetaController.getInteractionModelLocales();
    const result = new Map();
    // get from map of templates
    httpClient.request({
        url: CONSTANTS.TEMPLATES.INTERACTION_MODEL_MAP,
        method: CONSTANTS.HTTP_REQUEST.VERB.GET
    }, 'GET_INTERACTION_MODEL_MAP', doDebug, (error, templateMapResponse) => {
        if (error) {
            return callback(`Failed to retrieve the template list.\nError: ${error}`);
        }
        if (templateMapResponse.statusCode !== 200) {
            return callback(`Failed to retrieve the template list, please see the details from the error response.
${JSON.stringify(templateMapResponse, null, 2)}`);
        }
        const templateIndexMap = JSON.parse(templateMapResponse.body);
        // assign for each locale
        for (const locale of selectedLocales) {
            if (R.keys(localIModelByLocale).includes(locale)) {
                continue;
            }
            const languageExtractor = (s) => R.slice(0, R.lastIndexOf('-', s), s);
            const language = languageExtractor(locale);
            const reusableLocale = R.find((k) => languageExtractor(k) === language)(R.keys(localIModelByLocale));
            if (reusableLocale) {
                result.set(locale, { uri: localIModelByLocale[reusableLocale], canCopy: true });
            } else {
                result.set(locale, { uri: templateIndexMap.INTERACTION_MODEL_BY_LANGUAGE[language], canCopy: false });
            }
        }
        callback(undefined, result);
    });
}

/**
 * Retrieve the template content from the url link.
 * @param {Set} templateSet Set of template URLs to get the content for
 * @param {Boolean} doDebug
 * @param {Function} callback Map { templateUrl: bodyContent }
 */
function _retrieveTemplatesByLanguage(templateSet, doDebug, callback) {
    const result = new Map();
    if (templateSet.size === 0) {
        return process.nextTick(() => {
            callback(undefined, result);
        });
    }
    async.forEach(templateSet.values(), (templateUrl, loopCallback) => {
        httpClient.request({
            url: templateUrl,
            method: CONSTANTS.HTTP_REQUEST.VERB.GET
        }, 'GET_INTERACTION_MODEL_TEMPLATE', doDebug, (error, response) => {
            if (error) {
                return loopCallback(`Failed to retrieve the template list.\n${error}`);
            }
            if (response.statusCode > 300) {
                return loopCallback(`Failed to retrieve the template list, please see the details from the error response.
${JSON.stringify(response, null, 2)}`);
            }
            result.set(templateUrl, response.body);
            loopCallback();
        });
    }, (error) => {
        callback(error, error ? undefined : result);
    });
}
