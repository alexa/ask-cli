const chalk = require("chalk");
const path = require("path");
const fs = require("fs");
const jsonViewer = require("./json-view");

// A map used to define message levels
// and set their display styles
const MESSAGE_CATEGORY_MAPPING = {
  TRACE: {
    level: 10,
    display: {},
  },
  DEBUG: {
    level: 20,
    display: {
      color: "gray",
      bold: false,
      prefix: "[Debug]: ",
      method: "warn",
    },
  },
  INFO: {
    level: 30,
    display: {
      color: null,
      bold: false,
      prefix: "",
      method: "log",
    },
  },
  WARN: {
    level: 40,
    display: {
      color: "yellow",
      bold: true,
      prefix: "[Warn]: ",
      method: "warn",
    },
  },
  ERROR: {
    level: 50,
    display: {
      color: "red",
      bold: true,
      prefix: "[Error]: ",
      method: "error",
    },
  },
  FATAL: {
    level: 60,
    display: {
      color: "rgb(128, 0, 0)",
      bold: true,
      prefix: "[Fatal]: ",
      method: "error",
    },
  },
};

let instance = null;

class Messenger {
  // Make this class as a singleton
  constructor({doDebug = false}) {
    if (!instance) {
      instance = this;
    }
    // TODO: change buffer data type to avoid overflow
    // Used to record all CLI std behaviors
    this._buffer = [];
    this.pausedMessages = [];
    this.pauseMessageDisplay = false;
    // This flag is for debug use in order to
    // determine whether commands is working on debug mode
    this.doDebug = doDebug || false;
    return instance;
  }

  static getInstance() {
    return instance || new Messenger({});
  }

  /**
   * If the commander works under debug mode, write all debug level messages to local file
   * when the messanger instance get disposed and set to null
   */
  dispose() {
    if (this.doDebug) {
      this.writeLogToFile();
    }
    this.resume();
    instance = null;
  }

  buffer(entry) {
    if (this.doDebug) {
      this._buffer.push(entry);
    }
  }

  /**
   * Used to track http request behaviors
   * Record information to buffer
   */
  trace(data) {
    const operation = "TRACE";
    this.buffer({
      time: Messenger.getTime(),
      operation,
      level: MESSAGE_CATEGORY_MAPPING[operation].level,
      msg: data,
    });
  }

  /**
   * Used to track CLI internal debug messages
   * Record CLI behaviors to buffer and
   * expose debug messages immediately when user have --debug option set
   * @param {*} data the message to display
   */
  debug(data) {
    const operation = "DEBUG";
    this.buffer({
      time: Messenger.getTime(),
      operation,
      level: MESSAGE_CATEGORY_MAPPING[operation].level,
      msg: data,
    });
    if (this.doDebug) {
      this.displayMessage(operation, data);
    }
  }

  /**
   * Used to display the information during the CLI command execution
   * @param {*} data the message to display
   */
  info(data) {
    const operation = "INFO";
    this.buffer({
      time: Messenger.getTime(),
      operation,
      level: MESSAGE_CATEGORY_MAPPING[operation].level,
      msg: data,
    });
    this.displayMessage(operation, data);
  }

  /**
   * record warn message to buffer and
   * print to console
   * @param {*} data the message to display
   */
  warn(data) {
    const msg = data instanceof Error ? data.message : jsonViewer.toString(data);
    const operation = "WARN";
    this.buffer({
      time: Messenger.getTime(),
      operation,
      level: MESSAGE_CATEGORY_MAPPING[operation].level,
      msg,
    });
    this.displayMessage(operation, msg);
  }

  /**
   * record error message to buffer and
   * print to console
   * @param {*} data the message to display
   */
  error(data) {
    const msg = data instanceof Error ? data.message : jsonViewer.toString(data);
    const operation = "ERROR";
    this.buffer({
      time: Messenger.getTime(),
      operation,
      level: MESSAGE_CATEGORY_MAPPING[operation].level,
      msg,
    });
    this.displayMessage(operation, msg);
  }

  /**
   * record fatal message to buffer and
   * print to console
   * @param {*} data the message to display
   */
  fatal(data) {
    const msg = data instanceof Error ? data.stack.substring(7) : data;
    const operation = "FATAL";
    this.buffer({
      time: Messenger.getTime(),
      operation,
      level: MESSAGE_CATEGORY_MAPPING[operation].level,
      msg,
    });
    this.displayMessage(operation, msg);
  }

  /**
   * Starts buffering any new message and prevent them from getting displayed on the terminal
   *  until either the resume command is called or the Messenger object is disposed
   */
  pause() {
    this.pauseMessageDisplay = true;
  }

  /**
   * If paused was previously called this will resume display messages
   * as well as display any message that was previously paused.
   */
  resume() {
    this.pauseMessageDisplay = false;
    while (this.pausedMessages.length > 0) {
      const message = this.pausedMessages.shift();
      this.displayMessage(message.operation, message.data);
    }
  }

  /**
   * A view wrapper, print std in different styles according to different message category
   * @param {string} operation The message category
   * @param {string} data The text content to be displayed
   */
  displayMessage(operation, data) {
    if (this.pauseMessageDisplay) {
      this.pausedMessages.push({
        operation: operation,
        data: data,
      });
    } else {
      const {color, method, bold, prefix} = MESSAGE_CATEGORY_MAPPING[operation].display;
      const msg = prefix + data;
      Messenger.displayWithStyle(color, method, bold, msg);
    }
  }

  /**
   * The print function to display message in different styles
   * @param {string} color set the color of the text
   * @param {string} method set the console method, could be log, warn and error
   * @param {boolean} bold  a boolean value decide whether the font should be bold
   * @param {string} msg The text content to be displayed
   */
  static displayWithStyle(color, method, bold, msg) {
    const boldTag = bold ? "bold" : undefined;
    const colorTag = color || undefined;
    const finalTemplateTag = [boldTag, colorTag].filter((str) => str).join(".");
    if (!finalTemplateTag) {
      console[method](msg);
    } else {
      console[method](chalk`{${finalTemplateTag} ${msg}}`);
    }
  }

  /**
   * Read Trace level info from buffer,
   * modify the structure to make it easy to read,
   * write restructured info to a log file
   */
  writeLogToFile() {
    const time = Messenger.getTime();
    const filePath = path.join(process.cwd(), `ask-cli-${time}.log`);
    const content = [];
    for (const item of this._buffer) {
      if (item.operation === "TRACE") {
        content.push(`\n[${item.time}] - ${item.operation} - ${item.msg.activity.toUpperCase()}`);
        if (item.msg["request-id"]) {
          content.push(`\nrequest-id: ${item.msg["request-id"]}`);
        }
        content.push(`\n${item.msg.request.method} ${item.msg.request.url}`);
        content.push(`\nstatus code: ${item.msg.response.statusCode} ${item.msg.response.statusMessage}`);
        if (item.msg.error) {
          content.push(`\nerror: ${item.msg.error}\n`);
        }
        content.push(`\nRequest headers: ${JSON.stringify(item.msg.request.headers)}`);
        if (item.msg.request.body) {
          content.push(`\nRequest body: ${item.msg.request.body}`);
        }
        content.push(`\nResponse headers: ${JSON.stringify(item.msg.response.headers)}`);
        if (item.msg.body) {
          content.push(`\nResponse body: ${JSON.stringify(item.msg.body)}`);
        }
        content.push("\n----------------------------------------");
      }
    }
    if (content.length >= 1) {
      fs.writeFileSync(filePath, content);
      console.log(`\nDetail log has been recorded at ${filePath}`);
    }
  }

  /**
   * Used to get system time and format the time into the pattern of "week-month-day-year-hour:minute:second-time zone".
   * @returns string representation of the current date ie. Mon-Apr-01-2019-11:31:21-GMT-0700-(PDT)
   */
  static getTime() {
    return new Date().toString().replace(/ /g, "-");
  }
}

module.exports = Messenger;
