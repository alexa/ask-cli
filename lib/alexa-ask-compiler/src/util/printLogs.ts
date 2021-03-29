import {logger} from "./logger";

/**
 * displays the decompiler execution validation messages to the terminal.
 * @param logs = array
 */
export const printLogs = (logs: { type: string; message: string }[]) => {
    logs.forEach(({ type, message }) => {
        if (type === 'ERROR') {
            logger.error(message);
        } else if (type === 'WARN') {
            logger.warn(message);
        } else if (type === 'SUCCESS') {
            logger.success(message);
        } else {
            logger.info(message);
        }
    });
}