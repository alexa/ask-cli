"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJava = void 0;
const child_process_1 = require("child_process");
/**
 * verifies java presence
 * @public
 */
const verifyJava = () => {
    try {
        child_process_1.execSync('java -version', { stdio: 'ignore' });
    }
    catch (error) {
        // client side issue
        throw new Error(`${error}
Either Java is not installed or have not configured JAVA_HOME path correctly on your machine.
Please configure Java to run the ASK compiler successfully on your machine.
You can download and install the java depending on your operating system from - https://www.java.com/en/download/help/download_options.xml
If you are able to run 'java -version' successfully, but, still face issue while running ASK Compiler, please feel free to reach out to us on Github (https://github.com/alexa/ask-cli/issues).`);
    }
};
exports.verifyJava = verifyJava;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyaWZ5SmF2YS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3ZlcmlmeUphdmEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaURBQXVDO0FBRXZDOzs7R0FHRztBQUNJLE1BQU0sVUFBVSxHQUFHLEdBQUksRUFBRTtJQUM1QixJQUFJO1FBQ0Esd0JBQVEsQ0FBQyxlQUFlLEVBQUUsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztLQUNsRDtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osb0JBQW9CO1FBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxLQUFLOzs7O2dNQUlnSyxDQUFDLENBQUM7S0FDN0w7QUFDTCxDQUFDLENBQUE7QUFYWSxRQUFBLFVBQVUsY0FXdEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2V4ZWNTeW5jfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuXG4vKipcbiAqIHZlcmlmaWVzIGphdmEgcHJlc2VuY2VcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGNvbnN0IHZlcmlmeUphdmEgPSAoKSAgPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGV4ZWNTeW5jKCdqYXZhIC12ZXJzaW9uJywgeyBzdGRpbzogJ2lnbm9yZScgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLy8gY2xpZW50IHNpZGUgaXNzdWVcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2Vycm9yfVxuRWl0aGVyIEphdmEgaXMgbm90IGluc3RhbGxlZCBvciBoYXZlIG5vdCBjb25maWd1cmVkIEpBVkFfSE9NRSBwYXRoIGNvcnJlY3RseSBvbiB5b3VyIG1hY2hpbmUuXG5QbGVhc2UgY29uZmlndXJlIEphdmEgdG8gcnVuIHRoZSBBU0sgY29tcGlsZXIgc3VjY2Vzc2Z1bGx5IG9uIHlvdXIgbWFjaGluZS5cbllvdSBjYW4gZG93bmxvYWQgYW5kIGluc3RhbGwgdGhlIGphdmEgZGVwZW5kaW5nIG9uIHlvdXIgb3BlcmF0aW5nIHN5c3RlbSBmcm9tIC0gaHR0cHM6Ly93d3cuamF2YS5jb20vZW4vZG93bmxvYWQvaGVscC9kb3dubG9hZF9vcHRpb25zLnhtbFxuSWYgeW91IGFyZSBhYmxlIHRvIHJ1biAnamF2YSAtdmVyc2lvbicgc3VjY2Vzc2Z1bGx5LCBidXQsIHN0aWxsIGZhY2UgaXNzdWUgd2hpbGUgcnVubmluZyBBU0sgQ29tcGlsZXIsIHBsZWFzZSBmZWVsIGZyZWUgdG8gcmVhY2ggb3V0IHRvIHVzIG9uIEdpdGh1YiAoaHR0cHM6Ly9naXRodWIuY29tL2FsZXhhL2Fzay1jbGkvaXNzdWVzKS5gKTtcbiAgICB9XG59Il19