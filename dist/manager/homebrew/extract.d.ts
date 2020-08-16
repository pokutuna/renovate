import { PackageFile } from '../common';
export interface UrlPathParsedResult {
    currentValue: string;
    ownerName: string;
    repoName: string;
}
export declare function parseUrlPath(urlStr: string): UrlPathParsedResult | null;
export declare function extractPackageFile(content: string): PackageFile | null;
