'use strict';

const bunyan = require('bunyan');

const LEVEL_MAPPING = {
    10: 'TRACE',
    20: 'DEBUG',
    30: 'INFO',
    40: 'WARN',
    50: 'ERROR',
    60: 'FATAL'
};


/*
 * Singleton for Logger utility. Will only init once throughout the application
 */
module.exports = (function () {

    // Instance stores a reference to the Logger
    let instance;

    let logBuffer = [];

    function init() {

        function displayLogs () {
            console.warn('\n\n-------------------- Debug Mode --------------------');

            for (let item of logBuffer) {
                // display separators for each item before-hand except the first time
                if (item !== logBuffer[0]) {
                    console.warn('----------------------------------------');
                }
                item = JSON.parse(item);

                console.warn('[' + item.time + '] - ' + LEVEL_MAPPING[item.level] + ' - ' + item.activity.toUpperCase());
                if (item['request-id']) {
                    console.warn('request-id: ' + item['request-id']);
                }
                console.warn(item.request.method + ' ' + item.request.url);
                console.warn('status code: ' + item.response.statusCode + ' ' + item.response.statusMessage);
                if (item.error) {
                    console.warn('error: ' + item.error);
                }
                console.warn('\nRequest headers: ' + JSON.stringify(item.request.headers));
                if (item.request.body) {
                    console.warn('\nRequest body: ' + item.request.body);
                }
                console.warn('\nResponse headers: ' + JSON.stringify(item.response.headers));
                if (item.body) {
                    console.warn('\nResponse body: ' + JSON.stringify(item.body));
                }
            }
            console.warn();
        }

        let logger = bunyan.createLogger({
            name: 'logger',
            type: 'raw',
            stream: new CaptureStream(logBuffer),
            level: 'debug'
        });

        process.on('exit', () => {
            displayLogs();
        });

        // ctrl-c interrupt
        process.on('SIGINT', () => {
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
            display: displayLogs
        };
    }

    return {
        getInstance: function () {
            if (!instance) {
                instance = init();
            }
            return instance;
        }
    };
})();

/*
 * Inner class to rewrite the behaviour of bunyan stream
 */
function CaptureStream(buffer) {
    this.buffer = buffer;
}

CaptureStream.prototype.write = function(info) {
    this.buffer.push(info);
};
