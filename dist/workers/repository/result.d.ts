import { RenovateConfig } from '../../config';
declare type ProcessStatus = 'disabled' | 'enabled' | 'onboarding' | 'unknown';
export interface ProcessResult {
    res: string;
    status: ProcessStatus;
}
export declare function processResult(config: RenovateConfig, res: string): ProcessResult;
export {};
