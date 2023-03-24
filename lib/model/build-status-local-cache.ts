import {BuildDetailStep, BuildType} from "./skill-status";
import {ImportBuildStatus} from "./import-status";

/**
 * Local cache entry representing the BuildStatus for a specific locale
 */
export class BuildStatusLocalCacheEntry {
  private buildDetailSteps: {[key: string]: BuildDetailStep};
  private importBuildStatus: ImportBuildStatus;

  /**
   * Constructor function to instantiate a BuildStatusLocalCacheEntry object
   * @param {ImportBuildStatus} importStatus The import package status in the given locale
   */
  constructor(importBuildStatus: ImportBuildStatus) {
    this.buildDetailSteps = {};
    this.importBuildStatus = importBuildStatus;
  }

  /**
   * function to retrieve the BuildDetailStep for a given build type
   * @param buildType the build type
   * @returns {BuildDetailStep} the BuildDetailStep for a given build type
   */
  getBuildDetailStep(buildType: BuildType): BuildDetailStep {
    return this.buildDetailSteps[buildType];
  }

  /**
   * setter for the a given build detail step
   * @param buildDetailStep the BuildDetailStep object to set
   */
  setBuildDetailStep(buildDetailStep: BuildDetailStep) {
    this.buildDetailSteps[buildDetailStep.buildType] = buildDetailStep;
  }

  /**
   * getter for the import build status for the current locale
   * @returns {ImportBuildStatus}
   */
  getImportStatus(): ImportBuildStatus {
    return this.importBuildStatus;
  }

  /**
   * function to update the import build status for the current locale
   * @param importStatus the new import build status
   */
  setImportStatus(importStatus: ImportBuildStatus) {
    this.importBuildStatus = importStatus;
  }

  /**
   * function to check if the import build status for the current locale has started
   * @returns {boolean} true if the import build status for the current locale has started
   */
  hasBuildStarted(): boolean {
    return this.importBuildStatus !== undefined;
  }
}

/**
 * Class to abstract a local cache for storing the latest BuildStatus
 */
export class BuildStatusLocalCache {
  statuses: {[key: string]: BuildStatusLocalCacheEntry};

  constructor() {
    this.statuses = {};
  }

  /**
   * Function to fetch the BuildStatusLocalCacheEntry from the local cache
   * @param {string} locale The build locale for this specific local cache entry
   * @param {BuildType} buildType The Build Type for this specific local cache entry
   * @returns {BuildStatusLocalCacheEntry} BuildStatusLocalCacheEntry containing the BuildStatus for the provided locale
   */
  get(locale: string): BuildStatusLocalCacheEntry {
    return this.statuses[locale];
  }

  /**
   * Function to insert/update the BuildStatusLocalCacheEntry in the Local cache for the provided locale
   * @param {string} locale The build locale to insert into the local cache entry
   * @param {ImportBuildStatus} importBuildStatus The import build status for the given locale
   */
  set(locale: string, importBuildStatus: ImportBuildStatus) {
    this.statuses[locale] = this.statuses[locale] || new BuildStatusLocalCacheEntry(importBuildStatus);
    this.statuses[locale].setImportStatus(importBuildStatus);
  }
}
