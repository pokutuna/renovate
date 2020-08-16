import { RenovateConfig } from '../../../config/common';
export declare function get<T = any>(namespace: string, key: string): Promise<T>;
export declare function set(namespace: string, key: string, value: any, minutes: number): Promise<void>;
export declare function init(config: RenovateConfig): void;
export declare function cleanup(config: RenovateConfig): void;
