import Listr, { ListrContext, ListrOptions, ListrTaskWrapper } from 'listr';
import { EventEmitter } from 'events';
import { Observable } from 'rxjs';
import CliError from '@src/exceptions/cli-error';

type TaskCb = (err: Error | null, result: any) => void;

interface IReporter {
    updateStatus: (status: any) => void;
};

export type TaskHandle = (reporter: IReporter, cb: TaskCb) => void;

export interface MultiTasksViewError {
    error: CliError | string;
    partialResult?: ListrContext;
};

export type StartCb = (err: MultiTasksViewError | null, ctx?: ListrContext) => void;

/**
 * Reactive (rxjs) task class which serve as the middleware for Listr task registration
 */
export class ListrReactiveTask {
    private _eventEmitter: EventEmitter;
    private _taskHandle: TaskHandle;
    private _taskId: string | number;

    /**
     * Constructor method which will initiate an eventEmitter for each instance.
     * @param {Funciton} taskHandle the task handle which will be executed later, in the interface of:
     *                              (reporter, callback) => { // use reporter and callback in the actual logic }
     * @param {String} taskId taskId used to track task result
     */
    constructor(taskHandle: TaskHandle, taskId: string | number) {
        this._taskHandle = taskHandle;
        this._taskId = taskId;

        this._eventEmitter = new EventEmitter();
    }

    /**
     * Reporter getter function which returns methods used for task executor to send updates
     * - reporter.updateStatus update "status" for a task
     */
    get reporter() {
        return {
            updateStatus: (status: any) => {
                this._eventEmitter.emit('status', status);
            }
        };
    }

    /**
     * Execute the task handle, and convert task callback result to managed event.
     */
    execute() {
        this._taskHandle(this.reporter, (err: Error | null, result: any) => {
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
    // Type '(ctx: any, task: ListrTask) => Observable<any>' is not assignable to type '(ctx: any, task: ListrTaskWrapper<any>) => void | ListrTaskResult<any>'.
    buildObservable() {
        return (ctx: any, task: ListrTaskWrapper) => new Observable((subscriber) => {
            this._eventEmitter.on('status', (status) => {
                subscriber.next(status);
            });
            this._eventEmitter.on('error', (error) => {
                subscriber.error(error);
            });
            this._eventEmitter.on('title', (title) => {
                task.title = title;
            });
            this._eventEmitter.on('complete', (result) => {
                subscriber.complete();
                if (result) {
                    ctx[this._taskId] = result;
                }
            });
        });
    }
}

/**
 * MultiTasksView wraps Listr to inject ListrReactiveTask as the interface of each registered task.
 */
export default class MultiTasksView {
    private _listrTasks: ListrReactiveTask[];
    private _taskRunner: Listr;

    /**
     * Constructor using the same options definition for Listr.
     * @param {Object} options
     */
    constructor(options: ListrOptions) {
        this._taskRunner = new Listr([], options);
        this._listrTasks = [];
    }

    /**
     * Load task as ListrReactiveTask instance.
     * @param {Function} task the task handle which will be executed later, in the interface of:
     *                        (reporter, callback) => { // use reporter and callback in the actual logic }
     * @param {String} title the initial task title to be displayed
     * @param {String} taskId the identifier for the task to be used to pass back result
     */
    loadTask(task: TaskHandle, title: string, taskId: string | number) {
        const newTask = new ListrReactiveTask(task, taskId);
        this._listrTasks.push(newTask);
        const observableTask = newTask.buildObservable() as any;
        this._taskRunner.add({ title, task: observableTask });
    }

    /**
     * Register the event listeners and start the multi-tasks.
     * @param {Function} callback (error, context) context.${taskId} contains the result for each task
     */
    start(callback: StartCb) {
        if (this._listrTasks.length === 0) {
            return callback({ error: 'No tasks in current multi-tasks runner.' });
        }

        this._listrTasks.forEach((task) => {
            task.execute();
        });
        this._taskRunner.run().then((context: ListrContext) => {
            callback(null, context);
        }).catch((listrError: any) => {
            const errorMessage = listrError.errors
                .map((e: any) => e.resultMessage || e.message || e).join('\n');
            callback({
                error: new CliError(errorMessage),
                partialResult: listrError.context
            });
        });
    }
}
