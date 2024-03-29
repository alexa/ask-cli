const fs = require("fs");
const tmp = require("tmp");
const path = require("path");
const archiver = require("archiver");
const AdmZip = require("adm-zip");

const httpClient = require("../clients/http-client");
const Messenger = require("../view/messenger");
const CONSTANTS = require("./constants");

module.exports = {
  createTempZip,
  unzipRemoteZipFile,
};

/**
 * function used to create a temporary zip file
 * @param {string} src The file path of resource want to zip
 * @param {callback} callback { error, filePath }
 */
function createTempZip(src, callback) {
  if (!src) {
    return callback("Zip file path must be set.");
  }

  fs.access(src, (fs.constants || fs).W_OK, (err) => {
    if (err) {
      return callback(`File access error. ${err}`);
    }
    if (path.extname(src) === ".zip" || path.extname(src) === ".jar") {
      Messenger.getInstance().debug(`The source file ${src} has already been compressed. Skip the zipping`);
      return callback(null, src);
    }
    // Create the temp zip at the same level of the source file
    const zipFilePath = tmp.tmpNameSync({
      prefix: "askcli_temp_",
      postfix: ".zip",
    });
    const writeStream = fs.createWriteStream(zipFilePath);
    const archive = archiver("zip");
    const stats = fs.statSync(src);

    archive.on("error", (archiveErr) => {
      callback(`Archive error. ${archiveErr}`);
    });

    archive.pipe(writeStream);
    if (stats.isFile()) {
      archive.file(src, {name: path.basename(src)});
    } else if (stats.isDirectory()) {
      archive.glob(
        "**/*",
        {
          cwd: src,
          ignore: path.basename(zipFilePath),
        },
        {},
      );
    }
    archive.finalize();

    writeStream.on("close", () => {
      callback(null, zipFilePath);
    });
  });
}

function unzipRemoteZipFile(url, targetPath, doDebug, callback) {
  httpClient.request(
    {
      url,
      method: CONSTANTS.HTTP_REQUEST.VERB.GET,
      encoding: null,
      responseType : "arraybuffer",
    },
    "get-zip-file",
    doDebug,
    (requestError, requestResponse) => {
      if (requestError) {
        return callback(requestError.errorMessage || requestError);
      }
      const zip = new AdmZip(requestResponse.body);
      try {
        zip.extractAllTo(targetPath, false);
      } catch (unzipErr) {
        return callback(unzipErr);
      }
      callback();
    },
  );
}
