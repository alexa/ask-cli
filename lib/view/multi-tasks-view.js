const Listr = require('listr');
const { EventEmitter } = require('events');
const { Observable } = require('rxjs');
const CliError = require('@src/exceptions/cli-error');

/**
 * Reactive (rxjs) task class which serve as the middleware for Listr task registration
 */
class ListrReactiveTask {
    /**
     * Constructor method which will initiate an eventEmitter for each instance.
     * @param {Funciton} taskHandle the task handle which will be executed later, in the interface of:
     *                              (reporter, callback) => { // use reporter and callback in the actual logic }
     * @param {String} taskId taskId used to track task result
     */
    constructor(taskHandle, taskId) {
        this.taskHandle = taskHandle;
        this.taskId = taskId;

        this._eventEmitter = new EventEmitter();
    }

    /**
     * Reporter getter function which returns methods used for task executor to send updates
     * - reporter.updateStatus update "status" for a task
     */
    get reporter() {
        return {
            updateStatus: (status) => {
                this._eventEmitter.emit('status', status);
            }
        };
    }

    /**
     * Execute the task handle, and convert task callback result to managed event.
     */
    execute() {
        this.taskHandle(this.reporter, (err, result) => {
            if (err) {
                this._eventEmitter.emit('error', err);
            } else {
                this._eventEmitter.emit('complete', result);
            }
        });
    }

    /**
     * Connect EventEmitter to Rx.Observable by mapping the listened events to subscriber's action.
     * Mapping is:      event           observable
     *                  status          subscriber.next
     *                  error           subscriber.error + record error.context to task context
     *                  title           task.next
     *                  complete        subscriber.complete + record result to task context
     */
    buildObservable() {
        return (ctx, task) => new Observable((subscriber) => {
            this._eventEmitter.on('status', (status) => {
                subscriber.next(status);
            });
            this._eventEmitter.on('error', (error) => {
                if (error) {
                    subscriber.error(error);
                } else if (error && error.resultMessage) {
                    subscriber.error(error.resultMessage);
                    ctx[this.taskId] = error;
                }
            });
            this._eventEmitter.on('title', (title) => {
                task.title = title;
            });
            this._eventEmitter.on('complete', (result) => {
                subscriber.complete();
                if (result) {
                    ctx[this.taskId] = result;
                }
            });
        });
    }
}

/**
 * MultiTasksView wraps Listr to inject ListrReactiveTask as the interface of each registered task.
 */
class MultiTasksView {
    /**
     * Constructor using the same options definition for Listr.
     * @param {Object} options
     */
    constructor(options) {
        this.taskRunner = new Listr([], options);
        this._listrTasks = [];
    }

    /**
     * Load task as ListrReactiveTask instance.
     * @param {Function} task the task handle which will be executed later, in the interface of:
     *                        (reporter, callback) => { // use reporter and callback in the actual logic }
     * @param {String} title the initial task title to be displayed
     * @param {String} taskId the identifier for the task to be used to pass back result
     */
    loadTask(task, title, taskId) {
        const newTask = new ListrReactiveTask(task, taskId);
        this._listrTasks.push(newTask);
        this.taskRunner.add({ title, task: newTask.buildObservable() });
    }

    /**
     * Register the event listeners and start the multi-tasks.
     * @param {Function} callback (error, context) context.${taskId} contains the result for each task
     */
    start(callback) {
        if (this._listrTasks.length === 0) {
            return callback({ error: 'No tasks in current multi-tasks runner.' });
        }

        this._listrTasks.forEach((task) => {
            task.execute();
        });
        this.taskRunner.run().then((context) => {
            callback(null, context);
        }).catch((listrError) => {
            const errorMessage = listrError.errors
                .map(e => e.resultMessage || e.message || e).join('\n');
            callback({
                error: new CliError(errorMessage),
                partialResult: listrError.context
            });
        });
    }
}

module.exports = MultiTasksView;
module.exports.ListrReactiveTask = ListrReactiveTask;
