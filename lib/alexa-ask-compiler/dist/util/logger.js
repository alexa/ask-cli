"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
/* tslint:disable:no-console */
class Logger {
    constructor() {
        this.isDebug = process.env.DEBUG === "true";
    }
    silly(...message) {
        console.log(chalk_1.default.grey(`silly ${message.join(" ")}`));
    }
    info(...message) {
        console.log(chalk_1.default.white("info") + " " + message.join(" "));
    }
    warn(...message) {
        console.log(chalk_1.default.yellow("warn") + " " + message.join(" "));
    }
    success(...message) {
        console.log(chalk_1.default.bold.green("success") + " " + message.join(" "));
    }
    debug(...message) {
        if (this.isDebug)
            console.log(chalk_1.default.cyan("debug") + " " + message.join(" "));
    }
    error(...message) {
        console.log(chalk_1.default.bgRed("error") + " " + message.join(" "));
    }
}
exports.logger = new Logger();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWwvbG9nZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSwwREFBMEI7QUFFMUIsK0JBQStCO0FBQy9CLE1BQU0sTUFBTTtJQUdWO1FBQ0UsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssS0FBSyxNQUFNLENBQUM7SUFDOUMsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFHLE9BQWlCO1FBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBSyxDQUFDLElBQUksQ0FBQyxTQUFTLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVELElBQUksQ0FBQyxHQUFHLE9BQWlCO1FBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRCxJQUFJLENBQUMsR0FBRyxPQUFpQjtRQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLGVBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQsT0FBTyxDQUFDLEdBQUcsT0FBaUI7UUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFFRCxLQUFLLENBQUMsR0FBRyxPQUFpQjtRQUN4QixJQUFJLElBQUksQ0FBQyxPQUFPO1lBQ2QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFHLE9BQWlCO1FBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxHQUFHLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzlELENBQUM7Q0FDRjtBQUVZLFFBQUEsTUFBTSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgZnJvbSBcImNoYWxrXCI7XG5cbi8qIHRzbGludDpkaXNhYmxlOm5vLWNvbnNvbGUgKi9cbmNsYXNzIExvZ2dlciB7XG4gIGlzRGVidWc6IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5pc0RlYnVnID0gcHJvY2Vzcy5lbnYuREVCVUcgPT09IFwidHJ1ZVwiO1xuICB9XG5cbiAgc2lsbHkoLi4ubWVzc2FnZTogc3RyaW5nW10pIHtcbiAgICBjb25zb2xlLmxvZyhjaGFsay5ncmV5KGBzaWxseSAke21lc3NhZ2Uuam9pbihcIiBcIil9YCkpO1xuICB9XG5cbiAgaW5mbyguLi5tZXNzYWdlOiBzdHJpbmdbXSkge1xuICAgIGNvbnNvbGUubG9nKGNoYWxrLndoaXRlKFwiaW5mb1wiKSArIFwiIFwiICsgbWVzc2FnZS5qb2luKFwiIFwiKSk7XG4gIH1cblxuICB3YXJuKC4uLm1lc3NhZ2U6IHN0cmluZ1tdKSB7XG4gICAgY29uc29sZS5sb2coY2hhbGsueWVsbG93KFwid2FyblwiKSArIFwiIFwiICsgbWVzc2FnZS5qb2luKFwiIFwiKSk7XG4gIH1cblxuICBzdWNjZXNzKC4uLm1lc3NhZ2U6IHN0cmluZ1tdKSB7XG4gICAgY29uc29sZS5sb2coY2hhbGsuYm9sZC5ncmVlbihcInN1Y2Nlc3NcIikgKyBcIiBcIiArIG1lc3NhZ2Uuam9pbihcIiBcIikpO1xuICB9XG5cbiAgZGVidWcoLi4ubWVzc2FnZTogc3RyaW5nW10pIHtcbiAgICBpZiAodGhpcy5pc0RlYnVnKVxuICAgICAgY29uc29sZS5sb2coY2hhbGsuY3lhbihcImRlYnVnXCIpICsgXCIgXCIgKyBtZXNzYWdlLmpvaW4oXCIgXCIpKTtcbiAgfVxuXG4gIGVycm9yKC4uLm1lc3NhZ2U6IHN0cmluZ1tdKSB7XG4gICAgY29uc29sZS5sb2coY2hhbGsuYmdSZWQoXCJlcnJvclwiKSArIFwiIFwiICsgbWVzc2FnZS5qb2luKFwiIFwiKSk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoKTtcbiJdfQ==