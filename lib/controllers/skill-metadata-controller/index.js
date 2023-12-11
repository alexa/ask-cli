const R = require("ramda");
const fs = require("fs-extra");
const path = require("path");

const retryUtils = require("../../utils/retry-utility");
const ResourcesConfig = require("../../model/resources-config");
const SmapiClient = require("../../clients/smapi-client").default;
const httpClient = require("../../clients/http-client");
const Manifest = require("../../model/manifest");
const {BuildStatusLocalCache} = require("../../model/build-status-local-cache");
const {ImportStatus} = require("../../model/import-status");
const {SkillStatus, AC_QUICK_BUILD, AC_FULL_BUILD} = require("../../model/skill-status");
const Messenger = require("../../view/messenger");
const jsonView = require("../../view/json-view");
const stringUtils = require("../../utils/string-utils");
const zipUtils = require("../../utils/zip-utils");
const hashUtils = require("../../utils/hash-utils");
const CONSTANTS = require("../../utils/constants");
const CLiError = require("../../exceptions/cli-error");
const CLiWarn = require("../../exceptions/cli-warn");
const acUtil = require("../../utils/ac-util");
const acdl = require("@alexa/acdl");
const {
  IMPORT_STATUS_AC_BUILD_SUCCESS_EVENT,
  IMPORT_STATUS_AC_BUILD_FAILED_EVENT,
  IMPORT_STATUS_BUILDING_AC_FULL_EVENT,
  IMPORT_STATUS_BUILDING_AC_LIGHT_EVENT,
  IMPORT_STATUS_IM_BUILD_SUCCESS_EVENT,
  IMPORT_STATUS_IM_BUILD_FAILED_EVENT,
} = require("../../view/import-status/import-status-view-events");
const {ImportStatusView} = require("../../view/import-status/import-status-view");

module.exports = class SkillMetadataController {
  /**
   * Constructor for SkillMetadataController
   * @param {Object} configuration { profile, doDebug }
   */
  constructor(configuration) {
    const {profile, doDebug} = configuration;
    this.smapiClient = new SmapiClient({profile, doDebug});
    this.profile = profile;
    this.doDebug = doDebug;
    this.importStatusPollView = undefined;
    this.isACSkill = undefined;
  }

  /**
   * Entry method for all the skill package deployment logic
   * @param {String} vendorId
   * @param {Function} callback (error)
   */
  deploySkillPackage(vendorId, ignoreHash, callback) {
    // 1.get valid skillMetadata src path
    let skillPackageSrc = ResourcesConfig.getInstance().getSkillMetaSrc(this.profile);
    if (!stringUtils.isNonBlankString(skillPackageSrc)) {
      return callback("Skill package src is not found in ask-resources.json.");
    }
    if (!fs.existsSync(skillPackageSrc)) {
      return callback(`File ${skillPackageSrc} does not exist.`);
    }

    // if it's AC skill, use the build/skill-package
    if (this.getIsAcSkill() === true) {
      const projectConfig = acdl.loadProjectConfigSync();
      const outDirPath = path.join(projectConfig.rootDir, projectConfig.outDir);
      skillPackageSrc = path.join(outDirPath, CONSTANTS.COMPILER.TARGETDIR);
    }

    // 2.compare hashcode between current and previous status to decide if necessary to upload
    hashUtils.getHash(skillPackageSrc, (hashErr, currentHash) => {
      if (hashErr) {
        return callback(hashErr);
      }
      const lastDeployHash = ResourcesConfig.getInstance().getSkillMetaLastDeployHash(this.profile);
      if (!ignoreHash && stringUtils.isNonBlankString(lastDeployHash) && lastDeployHash === currentHash) {
        return callback(
          "The hash of current skill package folder does not change compared to the last deploy hash result, " +
            "CLI will skip the deploy of skill package.",
        );
      }

      // 3.call smapiClient to create/upload skillPackage
      const skillId = ResourcesConfig.getInstance().getSkillId(this.profile);

      // print skill Id if this is the first time we see it
      this.getImportStatusPollView();
      if (skillId) {
        // need to encapsulate this with nextTick since we want to make sure the observable listeners are setup
        process.nextTick(() => {
          this.getImportStatusPollView().displaySkillId(skillId, true);
        });
      }

      this.putSkillPackage(skillPackageSrc, skillId, skillId ? null : vendorId, (putErr, currentSkillId) => {
        this.getImportStatusPollView().stop();
        this.getImportStatusPollView()
          .waitForCompletion()
          .then(() => {
            if (putErr) {
              return callback(putErr);
            }
            ResourcesConfig.getInstance().setSkillId(this.profile, currentSkillId);
            ResourcesConfig.getInstance().setSkillMetaLastDeployHash(this.profile, currentHash);
            callback();
          });
      });
    });
  }

  /**
   * Validates domain info
   */
  validateDomain() {
    if (process.env.ASK_FORCE_ENABLE) {
      Messenger.getInstance().warn("The ASK_FORCE_ENABLE environment variable is set. Skipping domain validation.\n");
      return;
    }

    const domainInfo = Manifest.getInstance().getApis();
    if (!domainInfo || R.isEmpty(domainInfo)) {
      throw new CLiError('Skill information is not valid. Please make sure "apis" field in the skill.json is not empty.');
    }

    const domainList = R.keys(domainInfo);
    if (domainList.length !== 1) {
      throw new CLiWarn("Skill with multiple api domains cannot be enabled. Skipping the enable process.\n");
    }
    if (CONSTANTS.SKILL.DOMAIN.CAN_ENABLE_DOMAIN_LIST.indexOf(domainList[0]) === -1) {
      throw new CLiWarn(`Skill api domain "${domainList[0]}" cannot be enabled. Skipping the enable process.\n`);
    }
  }

  /**
   * Function used to enable skill. It calls smapi getSkillEnablement function first to check if skill is already enabled,
   * if not, it will enable the skill by calling smapi enableSkill function.
   * @param {Function} callback (err, null)
   */
  enableSkill(callback) {
    const skillId = ResourcesConfig.getInstance().getSkillId(this.profile);
    if (!stringUtils.isNonBlankString(skillId)) {
      return callback(`[Fatal]: Failed to find the skillId for profile [${this.profile}],
 please make sure the skill metadata deployment has succeeded with result of a valid skillId.`);
    }

    this.smapiClient.skill.getSkillEnablement(skillId, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (err, response) => {
      if (err && err.statusCode === CONSTANTS.HTTP_REQUEST.STATUS_CODE.NOT_FOUND) {
        // When the skill is not yet enabled, the SMAPI getSkillEnablement status API returns a 404 not found.
        // therefore we need to call SMAPI enableSkill API to enable it.
        this.smapiClient.skill.enableSkill(skillId, CONSTANTS.SKILL.STAGE.DEVELOPMENT, (enableErr, enableResponse) => {
          if (enableErr && enableErr.statusCode >= 300) {
            return callback(jsonView.toString(enableErr.body || {}));
          }
          if (enableErr) {
            return callback(enableErr);
          }
          Messenger.getInstance().info("The skill has been enabled.\n");
          return callback();
        });
        return;
      }
      if (err && err.statusCode >= 300) {
        return callback(jsonView.toString(err.body));
      }
      if (err) {
        return callback(err);
      }

      Messenger.getInstance().info("The skill is already enabled, skipping skill enablement.\n");
      return callback();
    });
  }

  /**
   * Put skill package based on the input of skillId and vendorId:
   *   when vendorId is set but skillId is not, create skill package;
   *   when skillId is set but vendorId is not, update skill package.
   *
   * @param {String} skillId
   * @param {String} vendorId
   * @param {Function} callback (error, skillId)
   */
  putSkillPackage(skillPackageSrc, skillId, vendorId, callback) {
    // 1.zip and upload skill package
    this.uploadSkillPackage(skillPackageSrc, (uploadErr, uploadResult) => {
      if (uploadErr) {
        return callback(uploadErr);
      }
      // 2.import skill package with upload URL
      this._importPackage(skillId, vendorId, uploadResult.uploadUrl, (importErr, importResponse) => {
        if (importErr) {
          return callback(importErr);
        }
        const importId = path.basename(importResponse.headers.location);
        if (importId) {
          this.getImportStatusPollView().displayImportId(importId);
          ResourcesConfig.getInstance().setLastImportId(this.profile, importId);
          ResourcesConfig.getInstance().setLastImportTimestamp(this.profile, `${(new Date()).toISOString()}`);
          ResourcesConfig.getInstance().write();
        }
        // 3.poll for the skill package import status
        this._pollImportStatus(importId, (pollErr, pollResponse) => {
          if (pollErr) {
            return callback(pollErr);
          }

          if (pollResponse.body.status !== CONSTANTS.SKILL.PACKAGE_STATUS.SUCCEEDED) {
            if (this.getIsAcSkill() === false) {
              this.getImportStatusPollView().publishEvent("Interaction Model", IMPORT_STATUS_IM_BUILD_FAILED_EVENT);
            }
            callback(jsonView.toString(pollResponse.body));
          } else {
            if (this.getIsAcSkill() === false) {
              this.getImportStatusPollView().publishEvent("Interaction Model", IMPORT_STATUS_IM_BUILD_SUCCESS_EVENT);
            }
            callback(null, pollResponse.body.skill.skillId);
          }
        });
      });
    });
  }

  /**
   * Download the skill package by exporting the skill package and then download it into the skill project
   * @param {String} rootFolder Folder path for the skill project root
   * @param {String} skillId
   * @param {String stage
   * @param {Function} callback
   */
  getSkillPackage(rootFolder, skillId, stage, callback) {
    // 1.request to export skill package
    this._exportPackage(skillId, stage, (exportErr, exportResponse) => {
      if (exportErr) {
        return callback(exportErr);
      }
      const exportId = path.basename(R.view(R.lensPath(["headers", "location"]), exportResponse));

      // 2.poll for the skill package export status
      this._pollExportStatus(exportId, (pollErr, pollResponse) => {
        if (pollErr) {
          return callback(pollErr);
        }
        // TODO: check the error when statusCode is not 200 or check the body structure when status is not SUCCEEDED or check non skill case

        // 3.download skill package into local file system
        const skillPackageLocation = R.view(R.lensPath(["body", "skill", "location"]), pollResponse);
        const targetPath = path.join(rootFolder, "skill-package");
        zipUtils.unzipRemoteZipFile(skillPackageLocation, targetPath, false, (unzipErr) => {
          callback(unzipErr);
        });
      });
    });
  }

  /**
   * Upload skill package by zipping, creating upload URL, and then upload
   * @param {String} skillPackageSrc
   * @param {Function} callback (err, { uploadUrl, expiresAt })
   */
  uploadSkillPackage(skillPackageSrc, callback) {
    // 1.create upload URL for CLI to upload
    this._createUploadUrl((createUploadErr, createUploadResult) => {
      if (createUploadErr) {
        return callback(createUploadErr);
      }
      // 2.zip skill package
      const outputDir = path.join(process.cwd(), ".ask");
      zipUtils.createTempZip(skillPackageSrc, (zipErr, zipFilePath) => {
        if (zipErr) {
          return callback(zipErr);
        }
        // 3.upload zip file
        const uploadPayload = fs.readFileSync(zipFilePath);
        const operation = "upload-skill-package";
        httpClient.putByUrl(createUploadResult.uploadUrl, uploadPayload, operation, this.doDebug, (uploadErr, uploadResponse) => {
          fs.removeSync(zipFilePath);
          if (uploadErr) {
            return callback(uploadErr);
          }
          if (uploadResponse.statusCode >= 300) {
            return callback("[Error]: Upload of skill package failed. Please try again with --debug to see more details.");
          }
          callback(null, createUploadResult);
        });
      });
    });
  }

  /**
   * Updates the skill manifest using the skill-id from ask-states, and polls
   * the skill manifest status until it's finished updating.
   *
   * @param {error} callback
   */
  updateSkillManifest(callback) {
    const skillId = ResourcesConfig.getInstance().getSkillId(this.profile);
    const content = Manifest.getInstance().content;
    const stage = CONSTANTS.SKILL.STAGE.DEVELOPMENT;

    this.smapiClient.skill.manifest.updateManifest(skillId, stage, content, null, (updateErr, updateResponse) => {
      if (updateErr) {
        return callback(updateErr);
      }
      if (updateResponse.statusCode >= 300) {
        return callback(jsonView.toString(updateResponse.body));
      }

      // poll manifest status until finish
      this._pollSkillManifestStatus(skillId, (pollErr, pollResponse) => {
        if (pollErr) {
          return callback(pollErr);
        }
        const manifestStatus = R.view(R.lensPath(["body", "manifest", "lastUpdateRequest", "status"]), pollResponse);
        if (!manifestStatus) {
          return callback(`[Error]: Failed to extract the manifest result from SMAPI's response.\n${pollResponse}`);
        }
        if (manifestStatus !== CONSTANTS.SKILL.SKILL_STATUS.SUCCEEDED) {
          return callback(`[Error]: Updating skill manifest but received non-success message from SMAPI: ${manifestStatus}`);
        }
        callback();
      });
    });
  }

  /**
   * Poll skill's manifest status until the status is not IN_PROGRESS.
   *
   * @param {String} skillId
   * @param {Function} callback
   */
  _pollSkillManifestStatus(skillId, callback) {
    const retryConfig = {
      base: 2000,
      factor: 1.12,
      maxRetry: 50,
    };

    const retryCall = (loopCallback) => {
      this.smapiClient.skill.getSkillStatus(skillId, [CONSTANTS.SKILL.RESOURCES.MANIFEST], (statusErr, statusResponse) => {
        if (statusErr) {
          return loopCallback(statusErr);
        }
        if (statusResponse.statusCode >= 300) {
          return loopCallback(jsonView.toString(statusResponse.body));
        }
        loopCallback(null, statusResponse);
      });
    };

    const shouldRetryCondition = (retryResponse) =>
      R.view(R.lensPath(["body", "manifest", "lastUpdateRequest", "status"]), retryResponse) === CONSTANTS.SKILL.SKILL_STATUS.IN_PROGRESS;

    retryUtils.retry(retryConfig, retryCall, shouldRetryCondition, (err, res) => callback(err, err ? null : res));
  }

  /**
   * Read from the {skillPackage}/interactionModel/custom directory, check what locales the current project
   * is currently deploying to.
   * When we have the Model for entire skill-package, this method is better sitting there.
   *
   * @returns { [languageName]: iModelPath } where languageName is in the format of xx-YY
   */
  getInteractionModelLocales() {
    const skillPackagePath = path.join(process.cwd(), ResourcesConfig.getInstance().getSkillMetaSrc(this.profile));
    const iModelFolderPath = path.join(skillPackagePath, CONSTANTS.FILE_PATH.SKILL_PACKAGE.INTERACTION_MODEL, "custom");
    const supportedLocaleFiles = fs.readdirSync(iModelFolderPath).filter((file) => {
      const fileExt = path.extname(file);
      const fileNameNoExt = path.basename(file, fileExt);
      return fileExt === ".json" && R.includes(fileNameNoExt, R.keys(CONSTANTS.ALEXA.LANGUAGES));
    });
    const result = {};
    supportedLocaleFiles.forEach((file) => {
      const fileNameNoExt = path.basename(file, path.extname(file));
      result[fileNameNoExt] = path.join(iModelFolderPath, file);
    });
    return result;
  }

  /**
   * Wrapper for smapi createUpload function
   * @param {Function} callback (err, { uploadUrl, expiresAt })
   */
  _createUploadUrl(callback) {
    this.smapiClient.skillPackage.createUpload((createErr, createResponse) => {
      if (createErr) {
        return callback(createErr);
      }
      if (createResponse.statusCode >= 300) {
        return callback(jsonView.toString(createResponse.body));
      }
      callback(null, {
        uploadUrl: createResponse.body.uploadUrl,
        expiresAt: createResponse.body.expiresAt,
      });
    });
  }

  /**
   * Wrapper for smapi importPackage function. The response contains importId in its headers' location url.
   * @param {String} skillId
   * @param {String} vendorId
   * @param {String} location
   * @param {Function} callback (err, importResponse)
   */
  _importPackage(skillId, vendorId, location, callback) {
    this.smapiClient.skillPackage.importPackage(skillId, vendorId, location, (importErr, importResponse) => {
      if (importErr) {
        return callback(importErr);
      }
      if (importResponse.statusCode >= 300) {
        return callback(jsonView.toString(importResponse.body));
      }
      callback(null, importResponse);
    });
  }

  /**
   * Wrapper for smapi exportPackage function
   * @param {String} skillId
   * @param {String} stage
   * @param {Function} callback
   */
  _exportPackage(skillId, stage, callback) {
    this.smapiClient.skillPackage.exportPackage(skillId, stage, (exportErr, exportResponse) => {
      if (exportErr) {
        return callback(exportErr);
      }
      if (exportResponse.statusCode >= 300) {
        return callback(jsonView.toString(exportResponse.body));
      }
      callback(null, exportResponse);
    });
  }

  /**
   * Wrapper for polling smapi skill package import status.
   * @param {String} importId
   * @param {Function} callback (err, lastImportStatus)
   */
  _pollImportStatus(importId, callback) {
    const retryConfig =
      this.getIsAcSkill() === true
        ? {
            base: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_IMPORT_STATUS_FOR_AC.MIN_TIME_OUT,
            factor: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_IMPORT_STATUS_FOR_AC.FACTOR,
            maxRetry: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_IMPORT_STATUS_FOR_AC.MAX_RETRY,
          }
        : {
            base: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_IMPORT_STATUS.MIN_TIME_OUT,
            factor: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_IMPORT_STATUS.FACTOR,
            maxRetry: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_IMPORT_STATUS.MAX_RETRY,
          };
    const buildStatusLocalCache = new BuildStatusLocalCache();
    let shouldPrintWarning = true;

    const retryCall = (loopCallback) => {
      this.smapiClient.skillPackage.getImportStatus(importId, (pollErr, pollResponse) => {
        if (pollErr) {
          return loopCallback(pollErr);
        }

        // print skill Id if needed
        const skillId = R.view(R.lensPath(["body", "skill", "skillId"]), pollResponse);
        if (skillId) {
          this.getImportStatusPollView().displaySkillId(skillId, false);
        }

        if (pollResponse.statusCode >= 300) {
          return loopCallback(jsonView.toString(pollResponse.body));
        }
        const importStatusResponse = new ImportStatus(pollResponse);

        if (shouldPrintWarning && importStatusResponse.warnings.length > 0) {
          importStatusResponse.warnings.forEach((warning) => {
            Messenger.getInstance().warn(warning.message);
          });
          shouldPrintWarning = false;
        }

        const resources = importStatusResponse.resources ? importStatusResponse.resources : [];
        resources
          .filter((resource) => resource.locale !== "Manifest")
          .forEach((resource) => {
            const buildStatusLocalCacheEntry = buildStatusLocalCache.get(resource.locale) || {};
            if (Object.keys(buildStatusLocalCacheEntry).length == 0) {
              if (resource.status && this.getIsAcSkill() === true) {
                // If this is the first time seeing a import build status for AC Skills
                // print a message indicating the build is now In Progress for this locale
                this.getImportStatusPollView().publishEvent(resource.locale, IMPORT_STATUS_BUILDING_AC_LIGHT_EVENT);
              }
            }
            // update the local cache Import Build Status
            buildStatusLocalCache.set(resource.locale, resource.status);
          });

        if (this.getIsAcSkill() === true && stringUtils.isNonBlankString(importStatusResponse.skillId)) {
          this.smapiClient.skill.getSkillStatus(
            importStatusResponse.skillId,
            [CONSTANTS.SKILL.RESOURCES.INTERACTION_MODEL],
            (skillStatusErr, skillStatusResponse) => {
              if (skillStatusErr) {
                return loopCallback(skillStatusErr);
              }
              this.notifyUserOnACBuildsCompletion(skillStatusResponse, buildStatusLocalCache);
              loopCallback(null, pollResponse);
            },
          );
        } else {
          loopCallback(null, pollResponse);
        }
      });
    };
    const shouldRetryCondition = (retryResponse) => retryResponse.body.status === CONSTANTS.SKILL.PACKAGE_STATUS.IN_PROGRESS;
    retryUtils.retry(retryConfig, retryCall, shouldRetryCondition, (err, res) => callback(err, err ? null : res));
  }

  /**
   * Synchronous helper function to extract the Alexa Conversation build status from skill status response
   * and send a notification on the CLI as the Alexa Conversation builds complete.
   * @param {Object} skillStatusResponse SMAPI response from getSkillStatus call
   * @param {BuildStatusLocalCache} buildStatusLocalCache current build status context local cache
   */
  notifyUserOnACBuildsCompletion(skillStatusResponse, buildStatusLocalCache) {
    const skillStatus = new SkillStatus(skillStatusResponse);
    const lastUpdateRequests = skillStatus.interactionModel.lastUpdateRequests ? skillStatus.interactionModel.lastUpdateRequests : [];

    lastUpdateRequests.forEach((lastUpdateRequest) => {
      const lastUpdatedLocale = lastUpdateRequest.locale;
      const buildStatusLocalCacheEntry = buildStatusLocalCache.get(lastUpdatedLocale);

      Object.keys(lastUpdateRequest.buildDetailSteps).forEach((buildTypeName) => {
        const smapiBuildDetailStep = lastUpdateRequest.getBuildDetailStep(buildTypeName);

        // only process the skill status if the import status is showing the build has started see https://issues.labcollab.net/browse/ASKIT-36460
        if (buildStatusLocalCacheEntry?.hasBuildStarted() && smapiBuildDetailStep?.isACBuildType) {
          const buildType = smapiBuildDetailStep.buildType;
          const buildStatus = smapiBuildDetailStep.buildStatus;
          const localBuildDetailStep = buildStatusLocalCacheEntry.getBuildDetailStep(buildType) || {};

          if (localBuildDetailStep.buildStatus !== buildStatus) {
            // build status has changed report quick build as In Progress
            if (buildType === AC_QUICK_BUILD && buildStatus === CONSTANTS.SKILL.SKILL_STATUS.IN_PROGRESS) {
              this.getImportStatusPollView().publishEvent(lastUpdatedLocale, IMPORT_STATUS_BUILDING_AC_LIGHT_EVENT);
            }
            // build status has changed report on completed states
            if (buildStatus === CONSTANTS.SKILL.SKILL_STATUS.SUCCEEDED) {
              // send the build status successfull event
              if (buildType === AC_QUICK_BUILD) {
                this.getImportStatusPollView().publishEvent(lastUpdatedLocale, IMPORT_STATUS_BUILDING_AC_FULL_EVENT);
              } else if (buildType === AC_FULL_BUILD) {
                this.getImportStatusPollView().publishEvent(lastUpdatedLocale, IMPORT_STATUS_AC_BUILD_SUCCESS_EVENT);
              }
            } else if (buildStatus === CONSTANTS.SKILL.SKILL_STATUS.FAILED) {
              // send the build status failed event
              this.getImportStatusPollView().publishEvent(
                lastUpdatedLocale,
                IMPORT_STATUS_AC_BUILD_FAILED_EVENT,
                `${this.getBuildNameFromType(buildType)} failed for locale: ${lastUpdatedLocale}.`,
              );
            }
          }
          // Update the local cache entry
          buildStatusLocalCacheEntry.setBuildDetailStep(smapiBuildDetailStep);
        }
      });
    });
  }

  getBuildNameFromType(buildType) {
    let buildName = buildType;
    if (buildType === AC_QUICK_BUILD) {
      buildName = "Alexa Conversations Light Build";
    } else if (buildType === AC_FULL_BUILD) {
      buildName = "Alexa Conversations Full Build";
    }

    return buildName;
  }

  /**
   * Wrapper for polling smapi skill package export status.
   * @param {String} exportId
   * @param {Function} callback (err, lastExportStatus)
   */
  _pollExportStatus(exportId, callback) {
    const retryConfig = {
      base: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_EXPORT_STATUS.MIN_TIME_OUT,
      factor: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_EXPORT_STATUS.FACTOR,
      maxRetry: CONSTANTS.CONFIGURATION.RETRY.GET_PACKAGE_EXPORT_STATUS.MAX_RETRY,
    };
    const retryCall = (loopCallback) => {
      this.smapiClient.skillPackage.getExportStatus(exportId, (pollErr, pollResponse) => {
        if (pollErr) {
          return loopCallback(pollErr);
        }
        if (pollResponse.statusCode >= 300) {
          return loopCallback(jsonView.toString(pollResponse.body));
        }
        loopCallback(null, pollResponse);
      });
    };
    const shouldRetryCondition = (retryResponse) => retryResponse.body.status === CONSTANTS.SKILL.PACKAGE_STATUS.IN_PROGRESS;
    retryUtils.retry(retryConfig, retryCall, shouldRetryCondition, (err, res) => callback(err, err ? null : res));
  }

  getImportStatusPollView() {
    if (!this.importStatusPollView) {
      this.importStatusPollView =
        this.getIsAcSkill() === true
          ? new ImportStatusView(Object.keys(Manifest.getInstance().getPublishingLocales()))
          : new ImportStatusView(["Interaction Model"]);
    }

    return this.importStatusPollView;
  }

  getIsAcSkill() {
    this.isACSkill = this.isAcSkill || acUtil.isAcSkill(this.profile);
    return this.isACSkill;
  }
};
