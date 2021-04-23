"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Decompiler = void 0;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const path_1 = tslib_1.__importDefault(require("path"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const consts_1 = require("../util/consts");
const logger_1 = require("../util/logger");
const verifyJava_1 = require("../util/verifyJava");
const printLogs_1 = require("../util/printLogs");
class Decompiler {
    constructor() {
        /*
         copy the askir(.json) files from conversations/ to build/
        */
        this._copyASKIRFiles = (irFiles, rootDir) => {
            try {
                for (const irFile of irFiles) {
                    fs_extra_1.default.copyFileSync(path_1.default.join(rootDir, `${consts_1.ACDL_PATH}`, irFile), path_1.default.join(rootDir, `${consts_1.BUILD}`, irFile));
                }
            }
            catch (error) {
                throw new Error(`${consts_1.ASK_DECOMPILER} ${error}`);
            }
        };
        // create decompiled package which will be edited by devs
        this._saveACDLFiles = (acdlFiles, outputDirectory) => {
            // Following steps need to occur in sync and in-order
            // deletes conversations/ folder
            fs_extra_1.default.removeSync(outputDirectory);
            // creates conversations/ folder
            fs_extra_1.default.mkdirSync(outputDirectory, { recursive: true });
            // saving acdl files - would rewrite if the file already exist with same name
            acdlFiles.forEach(({ name, content }) => {
                fs_extra_1.default.writeFile(path_1.default.join(outputDirectory, `${name}.acdl`), content, (err) => {
                    if (err)
                        throw new Error("Error occurred while saving acdl files" + err);
                });
            });
        };
    }
    async decompile(decompilerInput) {
        try {
            verifyJava_1.verifyJava();
            logger_1.logger.info('************ Decompiling skill package ************');
            logger_1.logger.info(`Skill package directory: ${decompilerInput.rootDir}`);
            // if the exported conversations/ is empty, no decompilation
            if (!fs_extra_1.default.existsSync(decompilerInput.outDir) || fs_extra_1.default.readdirSync(decompilerInput.outDir).length === 0) {
                logger_1.logger.error(`no such directory or the directory is empty: ${decompilerInput.outDir}`);
                return {};
            }
            const command = `java -jar ${path_1.default.join(__dirname, "../../lib/compiler-1.0.jar")} ${decompilerInput.rootDir} decompile`;
            const decompilerResponse = JSON.parse(child_process_1.execSync(command, { encoding: 'utf8', maxBuffer: consts_1.TEN_MEGA_BYTES }));
            if (decompilerResponse.status === 'PASSED') {
                // creates build/ folder if doesn't exist
                fs_extra_1.default.mkdirSync(path_1.default.join(decompilerInput.rootDir, `${consts_1.BUILD}`), { recursive: true });
                // copy askir files from conversations/ to build/ if there is any
                const irFiles = fs_extra_1.default.readdirSync(path_1.default.join(decompilerInput.rootDir, `${consts_1.ACDL_PATH}`));
                if (irFiles) {
                    this._copyASKIRFiles(irFiles, decompilerInput.rootDir);
                }
                this._saveACDLFiles(decompilerResponse.files, decompilerInput.outDir);
            }
            printLogs_1.printLogs(decompilerResponse.logs);
            return {};
        }
        catch (error) {
            throw new Error(`${consts_1.ASK_DECOMPILER} ${error}`);
        }
    }
}
exports.Decompiler = Decompiler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb21waWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9kZWNvbXBpbGVyL2RlY29tcGlsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLGlEQUF5QztBQUN6Qyx3REFBd0I7QUFDeEIsZ0VBQTBCO0FBRTFCLDJDQUFrRjtBQUNsRiwyQ0FBd0M7QUFDeEMsbURBQWdEO0FBRWhELGlEQUE4QztBQUU5QyxNQUFhLFVBQVU7SUFBdkI7UUFnQ0k7O1VBRUU7UUFDTSxvQkFBZSxHQUFHLENBQUMsT0FBaUIsRUFBRSxPQUFlLEVBQUUsRUFBRTtZQUM3RCxJQUFJO2dCQUNBLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFO29CQUMxQixrQkFBRSxDQUFDLFlBQVksQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLGtCQUFTLEVBQUUsRUFBRSxNQUFNLENBQUMsRUFBRSxjQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLGNBQUssRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7aUJBQ3ZHO2FBQ0o7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDWixNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsdUJBQWMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2FBQ2pEO1FBQ0wsQ0FBQyxDQUFBO1FBRUQseURBQXlEO1FBQ2pELG1CQUFjLEdBQUcsQ0FBQyxTQUE4QyxFQUFFLGVBQXVCLEVBQUUsRUFBRTtZQUNqRyxxREFBcUQ7WUFFckQsZ0NBQWdDO1lBQ2hDLGtCQUFFLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQy9CLGdDQUFnQztZQUNoQyxrQkFBRSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsRUFBRSxTQUFTLEVBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUVwRCw2RUFBNkU7WUFDN0UsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7Z0JBQ3BDLGtCQUFFLENBQUMsU0FBUyxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLEdBQUcsSUFBSSxPQUFPLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxHQUFVLEVBQUUsRUFBRTtvQkFDN0UsSUFBSSxHQUFHO3dCQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBQzdFLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUE7SUFDTCxDQUFDO0lBNURHLEtBQUssQ0FBQyxTQUFTLENBQUMsZUFBZ0M7UUFDNUMsSUFBSTtZQUNBLHVCQUFVLEVBQUUsQ0FBQztZQUViLGVBQU0sQ0FBQyxJQUFJLENBQUMscURBQXFELENBQUMsQ0FBQztZQUNuRSxlQUFNLENBQUMsSUFBSSxDQUFDLDRCQUE0QixlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNuRSw0REFBNEQ7WUFDNUQsSUFBSSxDQUFDLGtCQUFFLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxrQkFBRSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDL0YsZUFBTSxDQUFDLEtBQUssQ0FBQyxnREFBZ0QsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQ3ZGLE9BQU8sRUFBRSxDQUFDO2FBQ2I7WUFDRCxNQUFNLE9BQU8sR0FBRyxhQUFhLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDRCQUE0QixDQUFDLElBQUksZUFBZSxDQUFDLE9BQU8sWUFBWSxDQUFDO1lBQ3ZILE1BQU0sa0JBQWtCLEdBQXdCLElBQUksQ0FBQyxLQUFLLENBQUMsd0JBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFHLFNBQVMsRUFBRSx1QkFBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hJLElBQUksa0JBQWtCLENBQUMsTUFBTSxLQUFLLFFBQVEsRUFBRTtnQkFDeEMseUNBQXlDO2dCQUN6QyxrQkFBRSxDQUFDLFNBQVMsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxjQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ2xGLGlFQUFpRTtnQkFDakUsTUFBTSxPQUFPLEdBQUcsa0JBQUUsQ0FBQyxXQUFXLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLEdBQUcsa0JBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbkYsSUFBSSxPQUFPLEVBQUU7b0JBQ1QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUMxRDtnQkFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDekU7WUFFRCxxQkFBUyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25DLE9BQU8sRUFBRSxDQUFDO1NBQ2I7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyx1QkFBYyxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDakQ7SUFDTCxDQUFDO0NBK0JKO0FBN0RELGdDQTZEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzLWV4dHJhXCI7XG5pbXBvcnQgeyBEZWNvbXBpbGVySW5wdXQsIERlY29tcGlsZXJPdXRwdXQsIERlY29tcGlsZXJSZXNwb25zZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgQVNLX0RFQ09NUElMRVIsIEFDRExfUEFUSCwgQlVJTEQsIFRFTl9NRUdBX0JZVEVTIH0gZnJvbSBcIi4uL3V0aWwvY29uc3RzXCI7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi91dGlsL2xvZ2dlcic7XG5pbXBvcnQgeyB2ZXJpZnlKYXZhIH0gZnJvbSAnLi4vdXRpbC92ZXJpZnlKYXZhJztcblxuaW1wb3J0IHsgcHJpbnRMb2dzIH0gZnJvbSAnLi4vdXRpbC9wcmludExvZ3MnO1xuXG5leHBvcnQgY2xhc3MgRGVjb21waWxlciB7XG4gICAgYXN5bmMgZGVjb21waWxlKGRlY29tcGlsZXJJbnB1dDogRGVjb21waWxlcklucHV0KTogUHJvbWlzZTxEZWNvbXBpbGVyT3V0cHV0PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2ZXJpZnlKYXZhKCk7XG5cbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCcqKioqKioqKioqKiogRGVjb21waWxpbmcgc2tpbGwgcGFja2FnZSAqKioqKioqKioqKionKTtcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKGBTa2lsbCBwYWNrYWdlIGRpcmVjdG9yeTogJHtkZWNvbXBpbGVySW5wdXQucm9vdERpcn1gKTtcbiAgICAgICAgICAgIC8vIGlmIHRoZSBleHBvcnRlZCBjb252ZXJzYXRpb25zLyBpcyBlbXB0eSwgbm8gZGVjb21waWxhdGlvblxuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRlY29tcGlsZXJJbnB1dC5vdXREaXIpIHx8IGZzLnJlYWRkaXJTeW5jKGRlY29tcGlsZXJJbnB1dC5vdXREaXIpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcihgbm8gc3VjaCBkaXJlY3Rvcnkgb3IgdGhlIGRpcmVjdG9yeSBpcyBlbXB0eTogJHtkZWNvbXBpbGVySW5wdXQub3V0RGlyfWApO1xuICAgICAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNvbW1hbmQgPSBgamF2YSAtamFyICR7cGF0aC5qb2luKF9fZGlybmFtZSwgXCIuLi8uLi9saWIvY29tcGlsZXItMS4wLmphclwiKX0gJHtkZWNvbXBpbGVySW5wdXQucm9vdERpcn0gZGVjb21waWxlYDtcbiAgICAgICAgICAgIGNvbnN0IGRlY29tcGlsZXJSZXNwb25zZSA6IERlY29tcGlsZXJSZXNwb25zZSA9IEpTT04ucGFyc2UoZXhlY1N5bmMoY29tbWFuZCwgeyBlbmNvZGluZzogJ3V0ZjgnICwgbWF4QnVmZmVyOiBURU5fTUVHQV9CWVRFUyB9KSk7XG4gICAgICAgICAgICBpZiAoZGVjb21waWxlclJlc3BvbnNlLnN0YXR1cyA9PT0gJ1BBU1NFRCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGVzIGJ1aWxkLyBmb2xkZXIgaWYgZG9lc24ndCBleGlzdFxuICAgICAgICAgICAgICAgIGZzLm1rZGlyU3luYyhwYXRoLmpvaW4oZGVjb21waWxlcklucHV0LnJvb3REaXIsIGAke0JVSUxEfWApLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAvLyBjb3B5IGFza2lyIGZpbGVzIGZyb20gY29udmVyc2F0aW9ucy8gdG8gYnVpbGQvIGlmIHRoZXJlIGlzIGFueVxuICAgICAgICAgICAgICAgIGNvbnN0IGlyRmlsZXMgPSBmcy5yZWFkZGlyU3luYyhwYXRoLmpvaW4oZGVjb21waWxlcklucHV0LnJvb3REaXIsIGAke0FDRExfUEFUSH1gKSk7XG4gICAgICAgICAgICAgICAgaWYgKGlyRmlsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY29weUFTS0lSRmlsZXMoaXJGaWxlcywgZGVjb21waWxlcklucHV0LnJvb3REaXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9zYXZlQUNETEZpbGVzKGRlY29tcGlsZXJSZXNwb25zZS5maWxlcywgZGVjb21waWxlcklucHV0Lm91dERpcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaW50TG9ncyhkZWNvbXBpbGVyUmVzcG9uc2UubG9ncyk7XG4gICAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7QVNLX0RFQ09NUElMRVJ9ICR7ZXJyb3J9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKlxuICAgICBjb3B5IHRoZSBhc2tpciguanNvbikgZmlsZXMgZnJvbSBjb252ZXJzYXRpb25zLyB0byBidWlsZC9cbiAgICAqL1xuICAgIHByaXZhdGUgX2NvcHlBU0tJUkZpbGVzID0gKGlyRmlsZXM6IHN0cmluZ1tdLCByb290RGlyOiBzdHJpbmcpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaXJGaWxlIG9mIGlyRmlsZXMpIHtcbiAgICAgICAgICAgICAgICBmcy5jb3B5RmlsZVN5bmMocGF0aC5qb2luKHJvb3REaXIsIGAke0FDRExfUEFUSH1gLCBpckZpbGUpLCBwYXRoLmpvaW4ocm9vdERpciwgYCR7QlVJTER9YCwgaXJGaWxlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7QVNLX0RFQ09NUElMRVJ9ICR7ZXJyb3J9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgZGVjb21waWxlZCBwYWNrYWdlIHdoaWNoIHdpbGwgYmUgZWRpdGVkIGJ5IGRldnNcbiAgICBwcml2YXRlIF9zYXZlQUNETEZpbGVzID0gKGFjZGxGaWxlczogeyBuYW1lOiBzdHJpbmc7IGNvbnRlbnQ6IHN0cmluZyB9W10sIG91dHB1dERpcmVjdG9yeTogc3RyaW5nKSA9PiB7XG4gICAgICAgIC8vIEZvbGxvd2luZyBzdGVwcyBuZWVkIHRvIG9jY3VyIGluIHN5bmMgYW5kIGluLW9yZGVyXG5cbiAgICAgICAgLy8gZGVsZXRlcyBjb252ZXJzYXRpb25zLyBmb2xkZXJcbiAgICAgICAgZnMucmVtb3ZlU3luYyhvdXRwdXREaXJlY3RvcnkpO1xuICAgICAgICAvLyBjcmVhdGVzIGNvbnZlcnNhdGlvbnMvIGZvbGRlclxuICAgICAgICBmcy5ta2RpclN5bmMob3V0cHV0RGlyZWN0b3J5LCB7IHJlY3Vyc2l2ZSA6IHRydWUgfSk7XG5cbiAgICAgICAgLy8gc2F2aW5nIGFjZGwgZmlsZXMgLSB3b3VsZCByZXdyaXRlIGlmIHRoZSBmaWxlIGFscmVhZHkgZXhpc3Qgd2l0aCBzYW1lIG5hbWVcbiAgICAgICAgYWNkbEZpbGVzLmZvckVhY2goKHsgbmFtZSwgY29udGVudCB9KSA9PiB7XG4gICAgICAgICAgICBmcy53cml0ZUZpbGUocGF0aC5qb2luKG91dHB1dERpcmVjdG9yeSwgYCR7bmFtZX0uYWNkbGApLCBjb250ZW50LCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHRocm93IG5ldyBFcnJvcihcIkVycm9yIG9jY3VycmVkIHdoaWxlIHNhdmluZyBhY2RsIGZpbGVzXCIgKyBlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0iXX0=