const fs = require('fs-extra');
const async = require('async');

const ResourcesConfig = require('@src/model/resources-config');
const stringUtils = require('@src/utils/string-utils');
const CodeBuilder = require('./code-builder');

module.exports = class SkillCodeController {
    /**
     * Constructor for SkillCodeController
     * @param {Object} configuration { profile, doDebug }
     */
    constructor(configuration) {
        const { profile, doDebug } = configuration;
        this.profile = profile;
        this.doDebug = doDebug;
    }

    /**
     * Decide the unique codebase to build and execute the building process from CodeBuilder
     * @param {Function} callback (error, uniqueCodeList)
     * @param {Function} callback.uniqueCodeList [{ src, build{file, folder}}, buildFlow, regionsList }]
     */
    buildCode(callback) {
        let uniqueCodeList;
        try {
            uniqueCodeList = this._resolveUniqueCodeList();
        } catch (codeErr) {
            return callback(codeErr);
        }
        // execute build logic based on the regional code settings
        async.each(uniqueCodeList, (codeProperty, eachCallback) => {
            const codeBuilder = new CodeBuilder({
                src: codeProperty.src,
                build: codeProperty.build,
                doDebug: this.doDebug
            });
            codeProperty.buildFlow = codeBuilder.buildFlow;
            codeBuilder.execute((execErr) => {
                eachCallback(execErr);
            });
        }, (err) => {
            callback(err, err ? null : uniqueCodeList);
        });
    }

    /**
     * Resolve the list of unique codebases from the codeResources from ask-resources config.
     * @return {Array} codeList in the structure of [{ src, build, regionsList }]
     */
    _resolveUniqueCodeList() {
        const codeRegionsList = ResourcesConfig.getInstance().getCodeRegions(this.profile);
        // register codeResources as a HashMap with following structure { codeSrc: [regionsList] }
        const codeSrcToRegionMap = new Map();
        for (const region of codeRegionsList) {
            const codeSrc = ResourcesConfig.getInstance().getCodeSrcByRegion(this.profile, region);
            if (!stringUtils.isNonBlankString(codeSrc)) {
                throw `Invalid code setting in region ${region}. "src" must be set if you want to deploy skill code with skill package.`;
            }
            if (!fs.existsSync(codeSrc)) {
                throw `Invalid code setting in region ${region}. File doesn't exist for code src: ${codeSrc}.`;
            }
            // check if HashMap has codeSrc: append the region if codeSrc exists, or register an array with current region to the codeSrc
            if (codeSrcToRegionMap.has(codeSrc)) {
                const existingRegions = codeSrcToRegionMap.get(codeSrc);
                existingRegions.push(region);
                codeSrcToRegionMap.set(codeSrc, existingRegions);
            } else {
                codeSrcToRegionMap.set(codeSrc, [region]);
            }
        }
        // convert the HashMap to a list of unique code properties list
        const uniqueCodeList = [];
        for (const entry of codeSrcToRegionMap.entries()) {
            uniqueCodeList.push({
                src: entry[0],
                build: ResourcesConfig.getInstance().getCodeBuildByRegion(this.profile, entry[1][0]),
                regionsList: entry[1]
            });
        }
        return uniqueCodeList;
    }
};
