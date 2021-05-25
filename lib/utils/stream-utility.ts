import { Transform, TransformCallback } from 'stream';

type BooleanCb = () => boolean;
type OnReadable = (chunk: any, enc: BufferEncoding) => void;
type OnFinish = () => void;
type OnTaskComplete = (err?: string | undefined) => boolean | undefined;
type OnPush = (chunk: any, encoding?: BufferEncoding | undefined) => boolean;
type TransformCb = (chunk: any, encoding: BufferEncoding, complete: OnTaskComplete, push: OnPush) => void;

export interface IParallelStream {
    isObjectMode: boolean;
    willTransform?: BooleanCb;
    concurrency: number;
};

/**
 * Class for ParallelTransform for Stream.
 * This class is used for the transform that needs to make async request immediately using the stream buffer.
 * @extends stream.Transform
 */
export class ParallelStream extends Transform {
    private _concurrency: number;
    private _active: number;
    private _willTransform?: BooleanCb;
    private _continueCallback?: TransformCallback;
    private _terminateCallback?: TransformCallback;
    private _onReadable: OnReadable;
    private _onFinish: OnFinish;
    private _transformCb: TransformCb;
    
    // _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void;

    /**
     * Create a ParallelStream
     * @param {function} transform
     * @param {function} onReadable
     * @param {function} onFinish
     * @param {object} options
     */
    constructor(transform: TransformCb, onReadable: OnReadable, onFinish: OnFinish, options: IParallelStream) {
        super({ objectMode: options.isObjectMode });

        this._transformCb = transform;
        this._onReadable = onReadable;
        this._onFinish = onFinish;
        this._willTransform = options.willTransform || undefined;

        this._active = 0; // Task not yet finished is active
        this._concurrency = options.concurrency; // Used to throttle the maximum tasks running in parallel

        this._terminateCallback = undefined; // This callback is used to store the _flush's done()
        this._continueCallback = undefined; // This callback is used to store _transform's done()
    }

    /**
     * Implement the transform logic, which will handle the stream buffer data with custom logic.
     * @param {Buffer} chunk
     * @param {string} enc
     * @param {function} done
     */
    // _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void;
    _transform(chunk: any, enc: BufferEncoding, done: TransformCallback) {
        this._onReadable(chunk, enc);
        if (!this._willTransform || this._willTransform()) {
            this._active++;
            this._transformCb(chunk, enc, this._onTaskComplete.bind(this), this.push.bind(this));
        }

        if (this._active < this._concurrency) {
            done();
        } else {
            this._continueCallback = done;
        }
    }

    /**
     * Implement the flush logic, which will only be called when stream is about to close.
     * @param {function} done
     */
    _flush(done: TransformCallback) {
        if (this._active > 0) {
            // Delay the done callback if there are still any tasks active.
            this._terminateCallback = done;
        } else {
            // Call overall onFinish when all task finishes.
            this._onFinish();
            done();
        }
    }

    /**
     * The onTaskComplete handler for each task.
     * @param {string} err
     */
    _onTaskComplete(err?: string) {
        this._active--;
        if (err) {
            return this.emit('error', err);
        }

        // Trigger the delayed done() from _transform
        const tmpContinueCallback = this._continueCallback;
        this._continueCallback = undefined;
        tmpContinueCallback && tmpContinueCallback(); // eslint-disable-line no-unused-expressions

        // When all the tasks finish, trigger terminateCallback i.e. the done() from _flush
        if (this._active === 0) {
            this._onFinish();
            this._terminateCallback && this._terminateCallback(); // eslint-disable-line no-unused-expressions
        }
    }
};
