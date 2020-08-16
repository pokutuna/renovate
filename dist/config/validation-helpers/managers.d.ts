import { PackageRule, ValidationMessage } from '../common';
export interface CheckManagerArgs {
    resolvedRule: PackageRule;
    currentPath: string;
}
/**
 * Only if type condition or context condition violated then errors array will be mutated to store metadata
 */
export declare function check({ resolvedRule, currentPath, }: CheckManagerArgs): ValidationMessage[];
