export declare function copyExtractFile(): Promise<string>;
export interface PythonSetup {
    extras_require: Record<string, string[]>;
    install_requires: string[];
}
export declare function parseReport(): Promise<PythonSetup>;
