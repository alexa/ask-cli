declare class Logger {
    isDebug: boolean;
    constructor();
    silly(...message: string[]): void;
    info(...message: string[]): void;
    warn(...message: string[]): void;
    success(...message: string[]): void;
    debug(...message: string[]): void;
    error(...message: string[]): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map