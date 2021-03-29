"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printLogs = void 0;
const logger_1 = require("./logger");
/**
 * displays the decompiler execution validation messages to the terminal.
 * @param logs = array
 */
const printLogs = (logs) => {
    logs.forEach(({ type, message }) => {
        if (type === 'ERROR') {
            logger_1.logger.error(message);
        }
        else if (type === 'WARN') {
            logger_1.logger.warn(message);
        }
        else if (type === 'SUCCESS') {
            logger_1.logger.success(message);
        }
        else {
            logger_1.logger.info(message);
        }
    });
};
exports.printLogs = printLogs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpbnRMb2dzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWwvcHJpbnRMb2dzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFnQztBQUVoQzs7O0dBR0c7QUFDSSxNQUFNLFNBQVMsR0FBRyxDQUFDLElBQXlDLEVBQUUsRUFBRTtJQUNuRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtRQUMvQixJQUFJLElBQUksS0FBSyxPQUFPLEVBQUU7WUFDbEIsZUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUN6QjthQUFNLElBQUksSUFBSSxLQUFLLE1BQU0sRUFBRTtZQUN4QixlQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3hCO2FBQU0sSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO1lBQzNCLGVBQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDM0I7YUFBTTtZQUNILGVBQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDeEI7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQTtBQVpZLFFBQUEsU0FBUyxhQVlyQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7bG9nZ2VyfSBmcm9tIFwiLi9sb2dnZXJcIjtcblxuLyoqXG4gKiBkaXNwbGF5cyB0aGUgZGVjb21waWxlciBleGVjdXRpb24gdmFsaWRhdGlvbiBtZXNzYWdlcyB0byB0aGUgdGVybWluYWwuXG4gKiBAcGFyYW0gbG9ncyA9IGFycmF5XG4gKi9cbmV4cG9ydCBjb25zdCBwcmludExvZ3MgPSAobG9nczogeyB0eXBlOiBzdHJpbmc7IG1lc3NhZ2U6IHN0cmluZyB9W10pID0+IHtcbiAgICBsb2dzLmZvckVhY2goKHsgdHlwZSwgbWVzc2FnZSB9KSA9PiB7XG4gICAgICAgIGlmICh0eXBlID09PSAnRVJST1InKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IobWVzc2FnZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ1dBUk4nKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybihtZXNzYWdlKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnU1VDQ0VTUycpIHtcbiAgICAgICAgICAgIGxvZ2dlci5zdWNjZXNzKG1lc3NhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8obWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn0iXX0=