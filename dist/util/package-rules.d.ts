import { PackageRule, UpdateType } from '../config';
export interface Config extends Record<string, any> {
    versioning?: string;
    packageFile?: string;
    depType?: string;
    depTypes?: string[];
    depName?: string;
    currentValue?: string;
    fromVersion?: string;
    lockedVersion?: string;
    updateType?: UpdateType;
    isBump?: boolean;
    sourceUrl?: string;
    language?: string;
    baseBranch?: string;
    manager?: string;
    datasource?: string;
    packageRules?: (PackageRule & Config)[];
}
export declare function applyPackageRules<T extends Config>(inputConfig: T): T;
