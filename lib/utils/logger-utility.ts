import bunyan from 'bunyan';
import { Stream } from 'stream';

const LEVEL_MAPPING: any = {
    10: 'TRACE',
    20: 'DEBUG',
    30: 'INFO',
    40: 'WARN',
    50: 'ERROR',
    60: 'FATAL'
};

export type ILoggerItem = any;

/*
 * Inner class to rewrite the behaviour of bunyan stream
 */
class CaptureStream extends Stream {
    private _buffer: ILoggerItem[];

    writable: boolean = true;

    constructor(buffer: ILoggerItem[]) {
        super();
        this._buffer = buffer;
    }

    write(info: ILoggerItem) {
        this._buffer.push(info);
        return true;
    }

    end() {}
};

/*
 * Singleton for Logger utility. Will only init once throughout the application
 */
export default class Logger {
    private static instance: Logger;

    private _logger: bunyan;
    private _logBuffer: ILoggerItem[] = [];

    private constructor() {
        const stream = new CaptureStream(this._logBuffer);
        this._logger = bunyan.createLogger({
            name: 'logger',
            type: 'raw',
            stream: stream,
            level: 'debug'
        });

        process.on('exit', () => {
            this.display();
        });

        // ctrl-c interrupt
        process.on('SIGINT', () => {
            process.exit(1);
        });
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }

        return Logger.instance;
    }

    /*
     * Record debug content
     * @params debugContent
     */
    debug(debugContent: any) {
        this._logger.debug(debugContent);
    }

    display () {
        console.warn('\n\n-------------------- Debug Mode --------------------');

        for (let item of this._logBuffer) {
            // display separators for each item before-hand except the first time
            if (item !== this._logBuffer[0]) {
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
}
