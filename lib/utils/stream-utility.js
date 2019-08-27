const stream = require('stream');

/**
 * Class for ParallelTransform for Stream.
 * This class is used for the transform that needs to make async request immediately using the stream buffer.
 * @extends stream.Transform
 */
module.exports.ParallelStream = class ParallelStream extends stream.Transform {
    /**
     * Create a ParallelStream
     * @param {function} transform
     * @param {function} onReadable
     * @param {function} onFinish
     * @param {object} options
     */
    constructor(transform, onReadable, onFinish, options) {
        super({ objectMode: options.isObjectMode });

        this.transform = transform;
        this.onReadable = onReadable;
        this.onFinish = onFinish;
        this.willTransform = options.willTransform || null;

        this.active = 0; // Task not yet finished is active
        this.concurrency = options.concurrency; // Used to throttle the maximum tasks running in parallel

        this.terminateCallback = null; // This callback is used to store the _flush's done()
        this.continueCallback = null; // This callback is used to store _transform's done()
    }

    /**
     * Implement the transform logic, which will handle the stream buffer data with custom logic.
     * @param {Buffer} chunk
     * @param {string} enc
     * @param {function} done
     */
    _transform(chunk, enc, done) {
        this.onReadable(chunk, enc);
        if (!this.willTransform || this.willTransform()) {
            this.active++;
            this.transform(chunk, enc, this._onTaskComplete.bind(this), this.push.bind(this));
        }

        if (this.active < this.concurrency) {
            done();
        } else {
            this.continueCallback = done;
        }
    }

    /**
     * Implement the flush logic, which will only be called when stream is about to close.
     * @param {function} done
     */
    _flush(done) {
        if (this.active > 0) {
            // Delay the done callback if there are still any tasks active.
            this.terminateCallback = done;
        } else {
            // Call overall onFinish when all task finishes.
            this.onFinish();
            done();
        }
    }

    /**
     * The onTaskComplete handler for each task.
     * @param {string} err
     */
    _onTaskComplete(err) {
        this.active--;
        if (err) {
            return this.emit('error', err);
        }

        // Trigger the delayed done() from _transform
        const tmpContinueCallback = this.continueCallback;
        this.continueCallback = null;
        tmpContinueCallback && tmpContinueCallback(); // eslint-disable-line no-unused-expressions

        // When all the tasks finish, trigger terminateCallback i.e. the done() from _flush
        if (this.active === 0) {
            this.onFinish();
            this.terminateCallback && this.terminateCallback(); // eslint-disable-line no-unused-expressions
        }
    }
};
