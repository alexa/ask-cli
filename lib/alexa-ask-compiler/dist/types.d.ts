/**
 * Type declarations
 */
export interface CompilerInput {
    /**
     * Root directory to compile. (Absolute path)
     * Currently, it needs to be the skill package directory.
     */
    rootDir: string;
    /**
     * Output of the compiler goes to this directory.
     * (Absolute path)
     */
    outDir: string;
}
export interface CompilerOutput {
}
export interface CompilerResponse {
    /**
     * Status of the compilation process
     * PASSED or FAILED
     */
    status: string;
    /**
     * Record of the compilation process
     * log type could be ERROR, WARN, SUCCESS...
     */
    logs: {
        type: string;
        message: string;
    }[];
    /**
     * Array of the compilation results
     * [{"name": fileName1, "content", fileContent1}, {"name": fileName2, "content", fileContent2}]
     */
    files: {
        name: string;
        content: string;
    }[];
}
export interface DecompilerInput {
    /**
     * Root directory to decompile. (Absolute path)
     * Currently, it needs to be the skill package directory.
     */
    rootDir: string;
    /**
     * Output of the decompiler goes to this directory.
     * (Absolute path)
     */
    outDir: string;
}
export interface DecompilerOutput {
}
export interface DecompilerResponse {
    /**
     * Status of the decompilation process
     * PASSED or FAILED
     */
    status: string;
    /**
     * Record of the decompilation process
     * log type could be ERROR, WARN, SUCCESS...
     */
    logs: {
        type: string;
        message: string;
    }[];
    /**
     * Array of the decompilation results
     * [{"name": fileName1, "content", fileContent1}, {"name": fileName2, "content", fileContent2}]
     */
    files: {
        name: string;
        content: string;
    }[];
}
//# sourceMappingURL=types.d.ts.map