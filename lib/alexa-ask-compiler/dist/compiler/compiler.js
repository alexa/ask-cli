"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compiler = void 0;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const path_1 = tslib_1.__importDefault(require("path"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const consts_1 = require("../util/consts");
const logger_1 = require("../util/logger");
const verifyJava_1 = require("../util/verifyJava");
const printLogs_1 = require("../util/printLogs");
class Compiler {
    constructor() {
        // save acir files
        this._saveACIRFiles = (acirFiles, outputDirectory) => {
            fs_extra_1.default.removeSync(outputDirectory);
            // creates build/ folder if doen't exist
            fs_extra_1.default.mkdirSync(outputDirectory, { recursive: true });
            // saving acir files. - would rewrite if the file already exist with same name
            acirFiles.forEach(({ name, content }) => {
                fs_extra_1.default.writeFileSync(path_1.default.join(outputDirectory, `${name}.json`), content);
            });
        };
    }
    async compile(compilerInput) {
        try {
            verifyJava_1.verifyJava();
            logger_1.logger.info('************ Compiling skill package ************');
            logger_1.logger.info(`Skill package directory: ${compilerInput.rootDir}`);
            const command = `java -jar ${path_1.default.join(__dirname, "../../lib/compiler-1.0.jar")} ${compilerInput.rootDir}`;
            const compilerResponse = JSON.parse(child_process_1.execSync(command, { encoding: 'utf8' }));
            if (compilerResponse.status === 'PASSED') {
                this._saveACIRFiles(compilerResponse.files, compilerInput.outDir);
            }
            printLogs_1.printLogs(compilerResponse.logs);
            return {};
        }
        catch (error) {
            throw new Error(`${consts_1.ASK_COMPILER} ${error}`);
        }
    }
}
exports.Compiler = Compiler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tcGlsZXIvY29tcGlsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLGlEQUF5QztBQUN6Qyx3REFBd0I7QUFDeEIsZ0VBQTBCO0FBRzFCLDJDQUErQztBQUMvQywyQ0FBd0M7QUFDeEMsbURBQWdEO0FBQ2hELGlEQUE4QztBQUU5QyxNQUFhLFFBQVE7SUFBckI7UUF1QkUsa0JBQWtCO1FBQ1YsbUJBQWMsR0FBRyxDQUFDLFNBQThDLEVBQUUsZUFBdUIsRUFBRSxFQUFFO1lBRWpHLGtCQUFFLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQy9CLHdDQUF3QztZQUN4QyxrQkFBRSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsRUFBRSxTQUFTLEVBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUVwRCw4RUFBOEU7WUFDOUUsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7Z0JBQ3BDLGtCQUFFLENBQUMsYUFBYSxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLEdBQUcsSUFBSSxPQUFPLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxRSxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQTtJQUNILENBQUM7SUFsQ0MsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUE0QjtRQUN4QyxJQUFJO1lBQ0YsdUJBQVUsRUFBRSxDQUFDO1lBRWIsZUFBTSxDQUFDLElBQUksQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO1lBQ2pFLGVBQU0sQ0FBQyxJQUFJLENBQUMsNEJBQTRCLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO1lBRWhFLE1BQU0sT0FBTyxHQUFHLGFBQWEsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsNEJBQTRCLENBQUMsSUFBSSxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDM0csTUFBTSxnQkFBZ0IsR0FBc0IsSUFBSSxDQUFDLEtBQUssQ0FBQyx3QkFBUSxDQUFDLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFaEcsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFO2dCQUN0QyxJQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDckU7WUFFRCxxQkFBUyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pDLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxxQkFBWSxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDL0M7SUFDSCxDQUFDO0NBZUY7QUFuQ0QsNEJBbUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBmcyBmcm9tIFwiZnMtZXh0cmFcIjtcblxuaW1wb3J0IHsgQ29tcGlsZXJJbnB1dCwgQ29tcGlsZXJPdXRwdXQsIENvbXBpbGVyUmVzcG9uc2UgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IEFTS19DT01QSUxFUiAgfSBmcm9tIFwiLi4vdXRpbC9jb25zdHNcIjtcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uL3V0aWwvbG9nZ2VyJztcbmltcG9ydCB7IHZlcmlmeUphdmEgfSBmcm9tICcuLi91dGlsL3ZlcmlmeUphdmEnO1xuaW1wb3J0IHsgcHJpbnRMb2dzIH0gZnJvbSAnLi4vdXRpbC9wcmludExvZ3MnO1xuXG5leHBvcnQgY2xhc3MgQ29tcGlsZXIge1xuICBhc3luYyBjb21waWxlKGNvbXBpbGVySW5wdXQ6IENvbXBpbGVySW5wdXQpOiBQcm9taXNlPENvbXBpbGVyT3V0cHV0PiB7XG4gICAgdHJ5IHtcbiAgICAgIHZlcmlmeUphdmEoKTtcblxuICAgICAgbG9nZ2VyLmluZm8oJyoqKioqKioqKioqKiBDb21waWxpbmcgc2tpbGwgcGFja2FnZSAqKioqKioqKioqKionKTtcbiAgICAgIGxvZ2dlci5pbmZvKGBTa2lsbCBwYWNrYWdlIGRpcmVjdG9yeTogJHtjb21waWxlcklucHV0LnJvb3REaXJ9YClcblxuICAgICAgY29uc3QgY29tbWFuZCA9IGBqYXZhIC1qYXIgJHtwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4uLy4uL2xpYi9jb21waWxlci0xLjAuamFyXCIpfSAke2NvbXBpbGVySW5wdXQucm9vdERpcn1gO1xuICAgICAgY29uc3QgY29tcGlsZXJSZXNwb25zZSA6IENvbXBpbGVyUmVzcG9uc2UgPSBKU09OLnBhcnNlKGV4ZWNTeW5jKGNvbW1hbmQsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KSk7XG5cbiAgICAgIGlmIChjb21waWxlclJlc3BvbnNlLnN0YXR1cyA9PT0gJ1BBU1NFRCcpIHtcbiAgICAgICAgICB0aGlzLl9zYXZlQUNJUkZpbGVzKGNvbXBpbGVyUmVzcG9uc2UuZmlsZXMsIGNvbXBpbGVySW5wdXQub3V0RGlyKTtcbiAgICAgIH1cblxuICAgICAgcHJpbnRMb2dzKGNvbXBpbGVyUmVzcG9uc2UubG9ncyk7XG4gICAgICByZXR1cm4ge307XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke0FTS19DT01QSUxFUn0gJHtlcnJvcn1gKTtcbiAgICB9XG4gIH1cblxuXG4gIC8vIHNhdmUgYWNpciBmaWxlc1xuICBwcml2YXRlIF9zYXZlQUNJUkZpbGVzID0gKGFjaXJGaWxlczogeyBuYW1lOiBzdHJpbmc7IGNvbnRlbnQ6IHN0cmluZyB9W10sIG91dHB1dERpcmVjdG9yeTogc3RyaW5nKSA9PiB7XG5cbiAgICAgIGZzLnJlbW92ZVN5bmMob3V0cHV0RGlyZWN0b3J5KTtcbiAgICAgIC8vIGNyZWF0ZXMgYnVpbGQvIGZvbGRlciBpZiBkb2VuJ3QgZXhpc3RcbiAgICAgIGZzLm1rZGlyU3luYyhvdXRwdXREaXJlY3RvcnksIHsgcmVjdXJzaXZlIDogdHJ1ZSB9KTtcblxuICAgICAgLy8gc2F2aW5nIGFjaXIgZmlsZXMuIC0gd291bGQgcmV3cml0ZSBpZiB0aGUgZmlsZSBhbHJlYWR5IGV4aXN0IHdpdGggc2FtZSBuYW1lXG4gICAgICBhY2lyRmlsZXMuZm9yRWFjaCgoeyBuYW1lLCBjb250ZW50IH0pID0+IHtcbiAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihvdXRwdXREaXJlY3RvcnksIGAke25hbWV9Lmpzb25gKSwgY29udGVudCk7XG4gICAgICB9KTtcbiAgfVxufVxuIl19