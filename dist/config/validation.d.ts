import { RenovateConfig, ValidationMessage } from './common';
export interface ValidationResult {
    errors: ValidationMessage[];
    warnings: ValidationMessage[];
}
export declare function validateConfig(config: RenovateConfig, isPreset?: boolean, parentPath?: string): Promise<ValidationResult>;
