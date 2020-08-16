import { RenovateConfig } from './common';
export interface MigratedConfig {
    isMigrated: boolean;
    migratedConfig: RenovateConfig;
}
export declare function migrateConfig(config: RenovateConfig, parentKey?: string | any): MigratedConfig;
