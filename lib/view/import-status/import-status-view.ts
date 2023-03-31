import Listr from "listr";
import {EventEmitter} from "events";
import {ListrTask} from "listr";
import {ImportStatusViewObservable} from "./import-status-view-observable";
import {
  ImportStatusViewEvents,
  IMPORT_STATUS_CANCEL_TASK_EVENT,
  IMPORT_STATUS_FETCHING_IMPORT_ID_SUCESS_EVENT,
  IMPORT_STATUS_FETCHING_NEW_SKILL_ID_SUCESS_EVENT,
  IMPORT_STATUS_FETCHING_SKILL_ID_SUCESS_EVENT,
} from "./import-status-view-events";
import {retry} from "../../utils/retry-utility";
import Messenger from "../messenger";

/**
 * View class used to print the status of an skill import
 */
export class ImportStatusView {
  private listr: Listr;
  private listrTasks: ListrTask[] = [];
  private eventMapping: Map<string, EventEmitter> = new Map();
  private skillIdTaskTitle = "Retrieving skill id...";
  private importIdTaskTitle = "Retrieving import id...";

  constructor(locales: string[], listr?: Listr) {
    // add skill id and import id tasks
    this.addTask(this.skillIdTaskTitle);
    this.addTask(this.importIdTaskTitle);
    // add all locales tasks
    locales.map((taskTitle) => this.addTask(taskTitle, `[${taskTitle}] Import model builder task.`));
    // initialize listr if not injected
    this.listr = listr ? listr : new Listr([], {concurrent: true, exitOnError: true});
    this.listr.add(this.listrTasks);
    Messenger.getInstance().pause();
    this.listr.run().catch((error) => {
      Messenger.getInstance().warn(error?.message);
    });
  }

  private addTask(taskTitle: string, initialText?: string): void {
    const emitter = new EventEmitter();
    const task: any = new ImportStatusViewObservable(emitter, taskTitle).getObservable();

    this.listrTasks.push({
      title: initialText ? initialText : taskTitle,
      task: task,
    });

    this.eventMapping.set(taskTitle, emitter);
  }

  /**
   * Function used to publish an update to one of the locales/tasks
   * @param {string} taskTitle title of the task. i.e. for a locale import model build task 'en-US'
   * @param {ImportStatusViewEvents} importStatusPollViewEventName Import status view event to emit
   * @param {string} value Optional value to pass along with the event
   */
  public publishEvent(taskTitle: string, importStatusPollViewEventName: ImportStatusViewEvents, value?: string): void {
    this.eventMapping.get(taskTitle)?.emit(importStatusPollViewEventName, value);
  }

  /**
   * Call this idempotence function once a skill id has been found
   *  this will publish the skill id on the terminal and completes the task
   * @param skillId Alexa skill id
   * @param fromLocalConfigurationFiles set to true, if this skill id was retreived from the local ask-state file. false if it was retrieved from the SMAPI service api calls
   */
  public displaySkillId(skillId: string, fromLocalConfigurationFiles: boolean) {
    const eventToPublish = fromLocalConfigurationFiles
      ? IMPORT_STATUS_FETCHING_SKILL_ID_SUCESS_EVENT
      : IMPORT_STATUS_FETCHING_NEW_SKILL_ID_SUCESS_EVENT;
    this.eventMapping.get(this.skillIdTaskTitle)?.emit(eventToPublish, skillId);
  }

  /**
   * Call this idempotence function with the import id once it has been retrieved from the SMAPI service calls
   *  this will publish the import id on the terminal and completes the task
   * @param importId Alexa skill model build import id
   */
  public displayImportId(importId: string) {
    this.eventMapping.get(this.importIdTaskTitle)?.emit(IMPORT_STATUS_FETCHING_IMPORT_ID_SUCESS_EVENT, importId);
  }

  /**
   * Call this function to stop all tasks from continuing to print/update on the terminal
   */
  public stop() {
    this.eventMapping.forEach((emitter) => {
      emitter.emit(IMPORT_STATUS_CANCEL_TASK_EVENT);
    });
  }

  /**
   * Async function that only returns once all the tasks have been disabled
   * @returns This promise returns once all the tasks have been disabled
   */
  public async waitForCompletion(): Promise<void> {
    return new Promise<void>((resolve) => {
      const retryEverySecondFor2Hrs = {
        base: 1000,
        factor: 1.0,
        maxRetry: 2 * 60 * 60,
      };
      const retryCall = (loopCallback: (isRunning: boolean) => {}) => {
        loopCallback(this.isRunning());
      };
      const shouldRetryCondition = (isRunning: boolean) => {
        return isRunning === true ? true : false;
      };
      const onRetryCompletion = () => {
        Messenger.getInstance().resume();
        resolve();
      };

      retry(retryEverySecondFor2Hrs, retryCall, shouldRetryCondition, onRetryCompletion);
    });
  }

  private isRunning(): boolean {
    let isRunning = false;

    this.listrTasks.forEach((task) => {
      if (task.enabled) {
        isRunning = true;
      }
    });

    return isRunning;
  }
}
