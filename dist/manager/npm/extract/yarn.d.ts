export declare type YarnLock = Record<string, string>;
export declare function getYarnLock(filePath: string): Promise<YarnLock>;
