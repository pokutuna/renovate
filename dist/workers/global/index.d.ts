import * as configParser from '../../config';
declare type RenovateConfig = configParser.RenovateConfig;
declare type RenovateRepository = configParser.RenovateRepository;
export declare function getRepositoryConfig(globalConfig: RenovateConfig, repository: RenovateRepository): Promise<RenovateConfig>;
export declare function start(): Promise<0 | 1>;
export {};
