const {expect} = require("chai");
const fs = require("fs-extra");
const path = require("path");
const sinon = require("sinon");

const {makeFolderInTempDirectory} = require("../../test-utils");
const CodeBuilder = require("../../../lib/controllers/skill-code-controller/code-builder");
const hashUtils = require("../../../lib/utils/hash-utils");

const fixturesDirectory = path.join(process.cwd(), "test", "integration", "fixtures", "code-builder");

const setUpTempFolder = (sourceDirName) => {
  const tempDirName = `${sourceDirName}-builder`;
  const cwd = makeFolderInTempDirectory(tempDirName);
  const sourceDir = path.join(fixturesDirectory, sourceDirName, "lambda");
  const buildFolder = path.join(cwd, ".ask", "lambda");
  const buildFile = path.join(buildFolder, "build.zip");
  return {
    src: sourceDir,
    build: {folder: buildFolder, file: buildFile},
  };
};

describe("code builder test", () => {
  it("| should build nodejs npm skill", (done) => {
    const config = setUpTempFolder("nodejs-npm");

    const codeBuilder = new CodeBuilder(config);

    const expectedMinSizeInBytes = 100000;
    codeBuilder.execute((err, res) => {
      expect(err).eql(null);
      expect(res).eql(undefined);
      const hash = hashUtils.getFileHash(config.build.file);
      expect(fs.existsSync(config.build.file)).eq(true);
      expect(fs.statSync(config.build.file).size).gt(expectedMinSizeInBytes);
      codeBuilder.execute(() => {
        const newHash = hashUtils.getFileHash(config.build.file);
        expect(hash).equal(newHash);
        done();
      });
    });
  });

  it("| should build python pip skill", (done) => {
    const config = setUpTempFolder("python-pip");

    const codeBuilder = new CodeBuilder(config);

    const expectedMinSizeInBytes = 1500000;
    codeBuilder.execute((err, res) => {
      expect(err).eql(null);
      expect(res).eql(undefined);
      const hash = hashUtils.getFileHash(config.build.file);
      expect(fs.existsSync(config.build.file)).eq(true);
      expect(fs.statSync(config.build.file).size).gt(expectedMinSizeInBytes);
      // consistent hashing on windows does not work due to chardet package
      if (process.platform === "win32") {
        done();
      } else {
        codeBuilder.execute(() => {
          const newHash = hashUtils.getFileHash(config.build.file);
          expect(hash).equal(newHash);
          done();
        });
      }
    });
  });

  it("| should build java mvn skill", (done) => {
    const config = setUpTempFolder("java-mvn");

    const codeBuilder = new CodeBuilder(config);

    const expectedMinSizeInBytes = 10000000;
    codeBuilder.execute((err, res) => {
      expect(err).eql(null);
      expect(res).eql(undefined);
      const hash = hashUtils.getFileHash(config.build.file);
      expect(fs.existsSync(config.build.file)).eq(true);
      expect(fs.statSync(config.build.file).size).gt(expectedMinSizeInBytes);
      codeBuilder.execute(() => {
        const newHash = hashUtils.getFileHash(config.build.file);
        expect(hash).equal(newHash);
        done();
      });
    });
  });

  it("| should build with custom script", (done) => {
    const sourceDirName = "custom";
    const config = setUpTempFolder(sourceDirName);
    const sourceDir = path.join(fixturesDirectory, sourceDirName);
    sinon.stub(process, "cwd").returns(sourceDir);

    const codeBuilder = new CodeBuilder(config);

    const expectedMinSizeInBytes = 100000;
    codeBuilder.execute((err, res) => {
      expect(err).eql(undefined);
      expect(res).eql(undefined);
      expect(fs.existsSync(config.build.file)).eq(true);
      expect(fs.statSync(config.build.file).size).gt(expectedMinSizeInBytes);
      done();
    });
  });

  it("| should zip only", (done) => {
    const config = setUpTempFolder("zip-only");

    const codeBuilder = new CodeBuilder(config);

    const expectedMinSizeInBytes = 100;
    codeBuilder.execute((err, res) => {
      expect(err).eql(null);
      expect(res).eql(undefined);
      const hash = hashUtils.getFileHash(config.build.file);
      expect(fs.existsSync(config.build.file)).eq(true);
      expect(fs.statSync(config.build.file).size).gt(expectedMinSizeInBytes);
      codeBuilder.execute(() => {
        const newHash = hashUtils.getFileHash(config.build.file);
        expect(hash).equal(newHash);
        done();
      });
    });
  });

  afterEach(() => {
    sinon.restore();
  });
});
