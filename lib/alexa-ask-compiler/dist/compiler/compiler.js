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
            const compilerResponse = JSON.parse(child_process_1.execSync(command, { encoding: 'utf8', maxBuffer: consts_1.TEN_MEGA_BYTES }));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tcGlsZXIvY29tcGlsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLGlEQUF5QztBQUN6Qyx3REFBd0I7QUFDeEIsZ0VBQTBCO0FBRzFCLDJDQUErRDtBQUMvRCwyQ0FBd0M7QUFDeEMsbURBQWdEO0FBQ2hELGlEQUE4QztBQUU5QyxNQUFhLFFBQVE7SUFBckI7UUF1QkUsa0JBQWtCO1FBQ1YsbUJBQWMsR0FBRyxDQUFDLFNBQThDLEVBQUUsZUFBdUIsRUFBRSxFQUFFO1lBRWpHLGtCQUFFLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQy9CLHdDQUF3QztZQUN4QyxrQkFBRSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsRUFBRSxTQUFTLEVBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUVwRCw4RUFBOEU7WUFDOUUsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7Z0JBQ3BDLGtCQUFFLENBQUMsYUFBYSxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLEdBQUcsSUFBSSxPQUFPLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxRSxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQTtJQUNILENBQUM7SUFsQ0MsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUE0QjtRQUN4QyxJQUFJO1lBQ0YsdUJBQVUsRUFBRSxDQUFDO1lBRWIsZUFBTSxDQUFDLElBQUksQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO1lBQ2pFLGVBQU0sQ0FBQyxJQUFJLENBQUMsNEJBQTRCLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO1lBRWhFLE1BQU0sT0FBTyxHQUFHLGFBQWEsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsNEJBQTRCLENBQUMsSUFBSSxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDM0csTUFBTSxnQkFBZ0IsR0FBc0IsSUFBSSxDQUFDLEtBQUssQ0FBQyx3QkFBUSxDQUFDLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLHVCQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFM0gsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFO2dCQUN0QyxJQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDckU7WUFFRCxxQkFBUyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pDLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxxQkFBWSxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDL0M7SUFDSCxDQUFDO0NBZUY7QUFuQ0QsNEJBbUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBmcyBmcm9tIFwiZnMtZXh0cmFcIjtcblxuaW1wb3J0IHsgQ29tcGlsZXJJbnB1dCwgQ29tcGlsZXJPdXRwdXQsIENvbXBpbGVyUmVzcG9uc2UgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IEFTS19DT01QSUxFUiwgVEVOX01FR0FfQllURVMgIH0gZnJvbSBcIi4uL3V0aWwvY29uc3RzXCI7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi91dGlsL2xvZ2dlcic7XG5pbXBvcnQgeyB2ZXJpZnlKYXZhIH0gZnJvbSAnLi4vdXRpbC92ZXJpZnlKYXZhJztcbmltcG9ydCB7IHByaW50TG9ncyB9IGZyb20gJy4uL3V0aWwvcHJpbnRMb2dzJztcblxuZXhwb3J0IGNsYXNzIENvbXBpbGVyIHtcbiAgYXN5bmMgY29tcGlsZShjb21waWxlcklucHV0OiBDb21waWxlcklucHV0KTogUHJvbWlzZTxDb21waWxlck91dHB1dD4ge1xuICAgIHRyeSB7XG4gICAgICB2ZXJpZnlKYXZhKCk7XG5cbiAgICAgIGxvZ2dlci5pbmZvKCcqKioqKioqKioqKiogQ29tcGlsaW5nIHNraWxsIHBhY2thZ2UgKioqKioqKioqKioqJyk7XG4gICAgICBsb2dnZXIuaW5mbyhgU2tpbGwgcGFja2FnZSBkaXJlY3Rvcnk6ICR7Y29tcGlsZXJJbnB1dC5yb290RGlyfWApXG5cbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBgamF2YSAtamFyICR7cGF0aC5qb2luKF9fZGlybmFtZSwgXCIuLi8uLi9saWIvY29tcGlsZXItMS4wLmphclwiKX0gJHtjb21waWxlcklucHV0LnJvb3REaXJ9YDtcbiAgICAgIGNvbnN0IGNvbXBpbGVyUmVzcG9uc2UgOiBDb21waWxlclJlc3BvbnNlID0gSlNPTi5wYXJzZShleGVjU3luYyhjb21tYW5kLCB7IGVuY29kaW5nOiAndXRmOCcsIG1heEJ1ZmZlcjogVEVOX01FR0FfQllURVMgfSkpO1xuXG4gICAgICBpZiAoY29tcGlsZXJSZXNwb25zZS5zdGF0dXMgPT09ICdQQVNTRUQnKSB7XG4gICAgICAgICAgdGhpcy5fc2F2ZUFDSVJGaWxlcyhjb21waWxlclJlc3BvbnNlLmZpbGVzLCBjb21waWxlcklucHV0Lm91dERpcik7XG4gICAgICB9XG5cbiAgICAgIHByaW50TG9ncyhjb21waWxlclJlc3BvbnNlLmxvZ3MpO1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtBU0tfQ09NUElMRVJ9ICR7ZXJyb3J9YCk7XG4gICAgfVxuICB9XG5cblxuICAvLyBzYXZlIGFjaXIgZmlsZXNcbiAgcHJpdmF0ZSBfc2F2ZUFDSVJGaWxlcyA9IChhY2lyRmlsZXM6IHsgbmFtZTogc3RyaW5nOyBjb250ZW50OiBzdHJpbmcgfVtdLCBvdXRwdXREaXJlY3Rvcnk6IHN0cmluZykgPT4ge1xuXG4gICAgICBmcy5yZW1vdmVTeW5jKG91dHB1dERpcmVjdG9yeSk7XG4gICAgICAvLyBjcmVhdGVzIGJ1aWxkLyBmb2xkZXIgaWYgZG9lbid0IGV4aXN0XG4gICAgICBmcy5ta2RpclN5bmMob3V0cHV0RGlyZWN0b3J5LCB7IHJlY3Vyc2l2ZSA6IHRydWUgfSk7XG5cbiAgICAgIC8vIHNhdmluZyBhY2lyIGZpbGVzLiAtIHdvdWxkIHJld3JpdGUgaWYgdGhlIGZpbGUgYWxyZWFkeSBleGlzdCB3aXRoIHNhbWUgbmFtZVxuICAgICAgYWNpckZpbGVzLmZvckVhY2goKHsgbmFtZSwgY29udGVudCB9KSA9PiB7XG4gICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ob3V0cHV0RGlyZWN0b3J5LCBgJHtuYW1lfS5qc29uYCksIGNvbnRlbnQpO1xuICAgICAgfSk7XG4gIH1cbn1cbiJdfQ==