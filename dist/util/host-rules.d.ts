import { HostRule } from '../types';
export declare function add(params: HostRule): void;
export interface HostRuleSearch {
    hostType?: string;
    url?: string;
}
export declare function find(search: HostRuleSearch): HostRule;
export declare function hosts({ hostType }: {
    hostType: string;
}): string[];
export declare function findAll({ hostType }: {
    hostType: string;
}): HostRule[];
export declare function clear(): void;
