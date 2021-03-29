"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecompileCommand = void 0;
const tslib_1 = require("tslib");
const decompiler_1 = require("../decompiler/decompiler");
const path_1 = tslib_1.__importDefault(require("path"));
const consts_1 = require("./../util/consts");
/**
 * Decompile Command - Decompiles the ASKIR files inside the project
 * and generates ACDL code for them.
 *
 * usage: askc decompile
 */
class DecompileCommand {
    constructor() {
        this._action = async (command) => {
            await this.decompiler.decompile({ rootDir: path_1.default.join(process.cwd(), consts_1.SKILL_PACKAGE_DIR), outDir: path_1.default.join(consts_1.SKILL_PACKAGE_DIR, '/conversations/') });
        };
        this.decompiler = new decompiler_1.Decompiler();
    }
    register(program) {
        program
            .command("decompile")
            .description("Decompile the project.")
            .action(this._action);
    }
}
exports.DecompileCommand = DecompileCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb21waWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL2RlY29tcGlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQ0EseURBQXNEO0FBQ3RELHdEQUF3QjtBQUN4Qiw2Q0FBcUQ7QUFJckQ7Ozs7O0dBS0c7QUFDSCxNQUFhLGdCQUFnQjtJQUczQjtRQVdRLFlBQU8sR0FBRyxLQUFLLEVBQUUsT0FBMEIsRUFBRSxFQUFFO1lBQ3JELE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBQyxPQUFPLEVBQUUsY0FBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsMEJBQWlCLENBQUMsRUFBRSxNQUFNLEVBQUUsY0FBSSxDQUFDLElBQUksQ0FBQywwQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQyxFQUFDLENBQUMsQ0FBQztRQUNuSixDQUFDLENBQUM7UUFaQSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksdUJBQVUsRUFBRSxDQUFDO0lBQ3JDLENBQUM7SUFFRCxRQUFRLENBQUMsT0FBMEI7UUFDakMsT0FBTzthQUNKLE9BQU8sQ0FBQyxXQUFXLENBQUM7YUFDcEIsV0FBVyxDQUFDLHdCQUF3QixDQUFDO2FBQ3JDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDMUIsQ0FBQztDQUtGO0FBakJELDRDQWlCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjb21tYW5kZXIgZnJvbSBcImNvbW1hbmRlclwiO1xuaW1wb3J0IHsgRGVjb21waWxlciB9IGZyb20gXCIuLi9kZWNvbXBpbGVyL2RlY29tcGlsZXJcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBTS0lMTF9QQUNLQUdFX0RJUiB9IGZyb20gJy4vLi4vdXRpbC9jb25zdHMnO1xuXG5pbXBvcnQgeyBBU0tDQ29tbWFuZCB9IGZyb20gXCIuL2Jhc2VcIjtcblxuLyoqXG4gKiBEZWNvbXBpbGUgQ29tbWFuZCAtIERlY29tcGlsZXMgdGhlIEFTS0lSIGZpbGVzIGluc2lkZSB0aGUgcHJvamVjdFxuICogYW5kIGdlbmVyYXRlcyBBQ0RMIGNvZGUgZm9yIHRoZW0uXG4gKlxuICogdXNhZ2U6IGFza2MgZGVjb21waWxlXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWNvbXBpbGVDb21tYW5kIGltcGxlbWVudHMgQVNLQ0NvbW1hbmQge1xuICBkZWNvbXBpbGVyOiBEZWNvbXBpbGVyO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZGVjb21waWxlciA9IG5ldyBEZWNvbXBpbGVyKCk7XG4gIH1cblxuICByZWdpc3Rlcihwcm9ncmFtOiBjb21tYW5kZXIuQ29tbWFuZCkge1xuICAgIHByb2dyYW1cbiAgICAgIC5jb21tYW5kKFwiZGVjb21waWxlXCIpXG4gICAgICAuZGVzY3JpcHRpb24oXCJEZWNvbXBpbGUgdGhlIHByb2plY3QuXCIpXG4gICAgICAuYWN0aW9uKHRoaXMuX2FjdGlvbik7XG4gIH1cblxuICBwcml2YXRlIF9hY3Rpb24gPSBhc3luYyAoY29tbWFuZDogY29tbWFuZGVyLkNvbW1hbmQpID0+IHtcbiAgICBhd2FpdCB0aGlzLmRlY29tcGlsZXIuZGVjb21waWxlKHtyb290RGlyOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgU0tJTExfUEFDS0FHRV9ESVIpLCBvdXREaXI6IHBhdGguam9pbihTS0lMTF9QQUNLQUdFX0RJUiwgJy9jb252ZXJzYXRpb25zLycpfSk7XG4gIH07XG59XG4iXX0=