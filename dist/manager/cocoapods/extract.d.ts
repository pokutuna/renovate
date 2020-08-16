import { PackageDependency, PackageFile } from '../common';
export interface ParsedLine {
    depName?: string;
    groupName?: string;
    spec?: string;
    subspec?: string;
    currentValue?: string;
    git?: string;
    tag?: string;
    path?: string;
    source?: string;
}
export declare function parseLine(line: string): ParsedLine;
export declare function gitDep(parsedLine: ParsedLine): PackageDependency | null;
export declare function extractPackageFile(content: string): PackageFile | null;
