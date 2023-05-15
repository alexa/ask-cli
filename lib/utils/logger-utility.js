"use strict";

const bunyan = require("bunyan");

const LEVEL_MAPPING = {
  10: "TRACE",
  20: "DEBUG",
  30: "INFO",
  40: "WARN",
  50: "ERROR",
  60: "FATAL",
};

/*
 * Singleton for Logger utility. Will only init once throughout the application
 */
module.exports = (function () {
  // Instance stores a reference to the Logger
  let instance;

  let logBuffer = [];

  function init() {
    function displayLogs() {
      console.warn("\n\n-------------------- Debug Mode --------------------");

      for (let item of logBuffer) {
        // display separators for each item before-hand except the first time
        if (item !== logBuffer[0]) {
          console.warn();
          console.warn("----------------------------------------");
        }
        item = JSON.parse(item);
        const requestId = (item["request-id"])? item["request-id"] : "";
        const requestMethodUrl = (item.request)? item.request.method + " " + item.request.url : "";
        const statusCode = (item.response)? item.response.statusCode + " " + item.response.statusMessage : "";
        const requestHeaders = (item.request)? JSON.stringify(item.request.headers) : "{}";
        const requestbody = (item.request && item.request.body)? item.request.body : "{}";
        const responseHeaders = (item.response)? JSON.stringify(item.response.headers): "{}";
        const responseBody = (item.body)? JSON.stringify(item.body): "{}";
        console.warn("[%s] - %s - %s", item.time, LEVEL_MAPPING[item.level], item.activity.toUpperCase());
        console.warn("%s", requestMethodUrl);
        console.warn("request-id: %s", requestId);
        console.warn("status code: %s", statusCode);
        console.warn();
        console.warn("Request headers: %s", requestHeaders);
        console.warn();
        console.warn("Request body: %s", requestbody);
        console.warn();
        console.warn("Response headers: %s", responseHeaders);
        console.warn();
        console.warn("Response body: %s", responseBody);
        if (item.error) {
          console.warn();
          console.warn("error: %s", JSON.stringify(item.error));
        }
      }
      console.warn();
    }

    let logger = bunyan.createLogger({
      name: "logger",
      type: "raw",
      stream: new CaptureStream(logBuffer),
      level: "debug",
    });

    process.on("exit", () => {
      displayLogs();
    });

    // ctrl-c interrupt
    process.on("SIGINT", () => {
      process.exit(1);
    });

    return {
      /*
       * Record debug content
       * @params debugContent
       */
      debug: (debugContent) => {
        logger.debug(debugContent);
      },

      /*
       * Display prettified logs to console
       */
      display: displayLogs,
    };
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = init();
      }
      return instance;
    },
  };
})();

/*
 * Inner class to rewrite the behaviour of bunyan stream
 */
function CaptureStream(buffer) {
  this.buffer = buffer;
}

CaptureStream.prototype.write = function (info) {
  this.buffer.push(info);
};
