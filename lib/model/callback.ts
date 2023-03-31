export type callbackError = Error | null;
export type uiCallback = (err: callbackError, result?: any) => void;
