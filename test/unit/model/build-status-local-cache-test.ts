import {expect} from "chai";
import {BuildStatusLocalCache, BuildStatusLocalCacheEntry} from "../../../lib/model/build-status-local-cache";
import {ImportBuildStatus} from "../../../lib/model/import-status";
import {BuildDetailStep, BuildLocale, BuildStatus, BuildType} from "../../../lib/model/skill-status";

describe("BuildStatusLocalCache ", () => {
  const LOCALE1: BuildLocale = BuildLocale["en-GB"];
  const LOCALE2: BuildLocale = BuildLocale["en-US"];
  const BUILD_TYPE1: BuildType = "ALEXA_CONVERSATIONS_QUICK_BUILD";
  const BUILD_TYPE2: BuildType = "ALEXA_CONVERSATIONS_FULL_BUILD";
  const BUILD_STATUS1: BuildStatus = "SUCCEEDED";
  const BUILD_STATUS2: BuildStatus = "FAILED";
  const IMPORT_BUILD_STATUS1: ImportBuildStatus = "IN_PROGRESS";
  const IMPORT_BUILD_STATUS2: ImportBuildStatus = "FAILED";
  const BUILD_DETAIL_STEP_1: BuildDetailStep = new BuildDetailStep(BUILD_TYPE1, BUILD_STATUS1);
  const BUILD_DETAIL_STEP_2: BuildDetailStep = new BuildDetailStep(BUILD_TYPE2, BUILD_STATUS2);

  it("constructor initializes a class object", () => {
    const obj: BuildStatusLocalCache = new BuildStatusLocalCache();
    expect(obj).to.be.instanceOf(BuildStatusLocalCache);
  });

  describe("get", () => {
    let localCache: BuildStatusLocalCache;

    beforeEach(() => {
      localCache = new BuildStatusLocalCache();
      localCache.set(LOCALE1, IMPORT_BUILD_STATUS1);
      localCache.get(LOCALE1).setBuildDetailStep(BUILD_DETAIL_STEP_1);
    });

    it("get when no object in the local cache", () => {
      expect(localCache.get(LOCALE2)).equal(undefined);
    });

    it("get when object is in the local cache", () => {
      const result: BuildStatusLocalCacheEntry = localCache.get(LOCALE1);
      expect(result.getBuildDetailStep(BUILD_TYPE1)).not.equal(undefined);
      expect(result.getBuildDetailStep(BUILD_TYPE1).buildType).equal(BUILD_TYPE1);
      expect(result.getBuildDetailStep(BUILD_TYPE1).buildStatus).equal(BUILD_STATUS1);
      expect(result.getBuildDetailStep(BUILD_TYPE1).isACBuildType).equal(true);
    });

    it("isACBuildType", () => {
      const nonACBuildType = "LANGUAGE_MODEL_FULL_BUILD";
      localCache.get(LOCALE1).setBuildDetailStep(new BuildDetailStep(nonACBuildType, BUILD_STATUS2));

      const result: BuildStatusLocalCacheEntry = localCache.get(LOCALE1);
      expect(result.getBuildDetailStep(nonACBuildType)).not.equal(undefined);
      expect(result.getBuildDetailStep(nonACBuildType).buildType).equal(nonACBuildType);
      expect(result.getBuildDetailStep(nonACBuildType).buildStatus).equal(BUILD_STATUS2);
      expect(result.getBuildDetailStep(nonACBuildType).isACBuildType).equal(false);
    });
  });

  describe("set", () => {
    let localCache: BuildStatusLocalCache;

    beforeEach(() => {
      localCache = new BuildStatusLocalCache();
    });

    it("inserts multiple local cache entries", () => {
      localCache.set(LOCALE1, IMPORT_BUILD_STATUS1);
      localCache.get(LOCALE1).setBuildDetailStep(new BuildDetailStep(BUILD_TYPE1, BUILD_STATUS1));
      localCache.set(LOCALE2, IMPORT_BUILD_STATUS2);
      localCache.get(LOCALE2).setBuildDetailStep(new BuildDetailStep(BUILD_TYPE2, BUILD_STATUS2));

      let result: BuildStatusLocalCacheEntry = localCache.get(LOCALE1);
      expect(result.getBuildDetailStep(BUILD_TYPE1).buildStatus).equal(BUILD_STATUS1);
      expect(result.getBuildDetailStep(BUILD_TYPE1).buildType).equal(BUILD_TYPE1);
      expect(result.getBuildDetailStep(BUILD_TYPE1).isACBuildType).equal(true);

      result = localCache.get(LOCALE2);
      expect(result.getBuildDetailStep(BUILD_TYPE2).buildStatus).equal(BUILD_STATUS2);
      expect(result.getBuildDetailStep(BUILD_TYPE2).buildType).equal(BUILD_TYPE2);
      expect(result.getBuildDetailStep(BUILD_TYPE2).isACBuildType).equal(true);
    });
  });

  describe("BuildStatusLocalCacheEntry", () => {
    let localCacheEntry: BuildStatusLocalCacheEntry;

    beforeEach(() => {
      localCacheEntry = new BuildStatusLocalCacheEntry(IMPORT_BUILD_STATUS1);
      localCacheEntry.setBuildDetailStep(BUILD_DETAIL_STEP_1);
    });

    describe("getBuildDetailStep", () => {
      it("returns the buildDetailStep", () => {
        const entry: BuildDetailStep = localCacheEntry.getBuildDetailStep(BUILD_TYPE1);
        expect(entry).not.eql(undefined);
        expect(entry.buildType).eql(BUILD_TYPE1);
        expect(entry.buildStatus).eql(BUILD_STATUS1);
        expect(entry.isACBuildType).eql(true);
      });

      it("with missing input returns undefined", () => {
        const entry: BuildDetailStep = localCacheEntry.getBuildDetailStep(BUILD_TYPE2);
        expect(entry).eql(undefined);
      });
    });

    describe("setBuildDetailStep", () => {
      it("can set multiple entries", () => {
        localCacheEntry.setBuildDetailStep(BUILD_DETAIL_STEP_2);
        let entry: BuildDetailStep = localCacheEntry.getBuildDetailStep(BUILD_TYPE1);
        expect(entry).not.eql(undefined);
        expect(entry.buildType).eql(BUILD_TYPE1);
        expect(entry.buildStatus).eql(BUILD_STATUS1);
        expect(entry.isACBuildType).eql(true);

        entry = localCacheEntry.getBuildDetailStep(BUILD_TYPE2);
        expect(entry).not.eql(undefined);
        expect(entry.buildType).eql(BUILD_TYPE2);
        expect(entry.buildStatus).eql(BUILD_STATUS2);
        expect(entry.isACBuildType).eql(true);
      });

      it("can override entries", () => {
        let entry: BuildDetailStep = localCacheEntry.getBuildDetailStep(BUILD_TYPE1);
        expect(entry.buildStatus).eql(BUILD_STATUS1);

        const updatedBuildDetailStep1: BuildDetailStep = new BuildDetailStep(BUILD_TYPE1, BUILD_STATUS2);
        localCacheEntry.setBuildDetailStep(updatedBuildDetailStep1);
        entry = localCacheEntry.getBuildDetailStep(BUILD_TYPE1);

        expect(entry.buildType).eql(BUILD_TYPE1);
        expect(entry.buildStatus).eql(BUILD_STATUS2);
        expect(entry.isACBuildType).eql(true);
      });
    });

    describe("ImportStatus", () => {
      it("returns initial import status passed to the constructor", () => {
        expect(localCacheEntry.getImportStatus()).eql(IMPORT_BUILD_STATUS1);
      });

      it("can be updated", () => {
        expect(localCacheEntry.getImportStatus()).eql(IMPORT_BUILD_STATUS1);
        localCacheEntry.setImportStatus(IMPORT_BUILD_STATUS2);
        expect(localCacheEntry.getImportStatus()).eql(IMPORT_BUILD_STATUS2);
      });
    });

    describe("hasBuildStarted", () => {
      it("when no build status specified", () => {
        localCacheEntry.setImportStatus(undefined as unknown as ImportBuildStatus);
        expect(localCacheEntry.hasBuildStarted()).to.be.false;
      });

      it("when any kind of build status is specified", () => {
        localCacheEntry.setImportStatus("anything" as unknown as ImportBuildStatus);
        expect(localCacheEntry.hasBuildStarted()).to.be.true;
      });
    });
  });
});
