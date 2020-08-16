import { RenovateConfig } from '../../config';
declare type ParentBranch = {
    reuseExistingBranch: boolean;
    isModified?: boolean;
};
export declare function shouldReuseExistingBranch(config: RenovateConfig): Promise<ParentBranch>;
export {};
