import {EventEmitter} from "events";
import {Observable} from "rxjs";
import {
  IMPORT_STATUS_AC_BUILD_FAILED_EVENT,
  IMPORT_STATUS_AC_BUILD_SUCCESS_EVENT,
  IMPORT_STATUS_BUILDING_AC_FULL_EVENT,
  IMPORT_STATUS_BUILDING_AC_LIGHT_EVENT,
  IMPORT_STATUS_FETCHING_IMPORT_ID_SUCESS_EVENT,
  IMPORT_STATUS_FETCHING_NEW_SKILL_ID_SUCESS_EVENT,
  IMPORT_STATUS_FETCHING_SKILL_ID_SUCESS_EVENT,
  IMPORT_STATUS_IM_BUILD_FAILED_EVENT,
  IMPORT_STATUS_IM_BUILD_SUCCESS_EVENT,
  IMPORT_STATUS_CANCEL_TASK_EVENT,
} from "./import-status-view-events";

export class ImportStatusViewObservable {
  private emitter: EventEmitter;
  private id: string;

  constructor(emitter: EventEmitter, id: string) {
    this.id = id;
    this.emitter = emitter;
  }

  getObservable() {
    return (_ctx: any, task: {taskId: string; title: string; enabled?: boolean}) => {
      task.taskId = this.id;
      task.enabled = true;
      return new Observable((observer: {complete: () => void; error: (error: Error) => void; next: (message: string) => void}) => {
        this.emitter.on(IMPORT_STATUS_CANCEL_TASK_EVENT, () => {
          if (task.enabled) {
            const status = `[${task.taskId}] task stopped polling for status.`;
            observer.error(new Error(status));
            task.enabled = false;
          }
        });

        this.emitter.on(IMPORT_STATUS_FETCHING_SKILL_ID_SUCESS_EVENT, (value: string) => {
          if (task.enabled) {
            const message = `Using pre-existing skill id: ${value}`;
            task.title = message;
            observer.complete();
            task.enabled = false;
          }
        });

        this.emitter.on(IMPORT_STATUS_FETCHING_NEW_SKILL_ID_SUCESS_EVENT, (value: string) => {
          if (task.enabled) {
            const message = `Received a new skill id: ${value}`;
            task.title = message;
            observer.complete();
            task.enabled = false;
          }
        });

        this.emitter.on(IMPORT_STATUS_FETCHING_IMPORT_ID_SUCESS_EVENT, (value: string) => {
          const message = `Importing skill using import id: ${value}`;
          task.title = message;
          observer.complete();
          task.enabled = false;
        });

        this.emitter.on(IMPORT_STATUS_IM_BUILD_SUCCESS_EVENT, () => {
          const status = `[${task.taskId}] build is complete.`;
          task.title = status;
          observer.complete();
          task.enabled = false;
        });

        this.emitter.on(IMPORT_STATUS_IM_BUILD_FAILED_EVENT, () => {
          const status = `[${task.taskId}] build has failed.`;
          task.title = status;
          observer.error(new Error(status));
          task.enabled = false;
        });

        this.emitter.on(IMPORT_STATUS_BUILDING_AC_LIGHT_EVENT, () => {
          const status = `[${task.taskId}] build is now in progress...`;
          task.title = status;
          observer.next("Building Alexa Conversations light build");
        });

        this.emitter.on(IMPORT_STATUS_BUILDING_AC_FULL_EVENT, () => {
          const status = `[${task.taskId}] Alexa Conversations light build is successful for locale: ${task.taskId}.`;
          task.title = status;
          observer.next(
            "You can now test some Alexa Conversations dialogs while we continue to train your model with additional simulated dialogs.",
          );
        });

        this.emitter.on(IMPORT_STATUS_AC_BUILD_SUCCESS_EVENT, () => {
          const message =
            `[${task.taskId}] Alexa Conversations full build is successful for locale: ${task.taskId}. ` +
            "You can now test Alexa Conversations dialogs.";
          task.title = message;
          observer.complete();
          task.enabled = false;
        });

        this.emitter.on(IMPORT_STATUS_AC_BUILD_FAILED_EVENT, (errorMessage: string) => {
          const message = `[${task.taskId}] Alexa Conversations build failed. Error: ${errorMessage}`;
          task.title = message;
          observer.error(new Error(errorMessage));
          task.enabled = false;
        });
      });
    };
  }
}
