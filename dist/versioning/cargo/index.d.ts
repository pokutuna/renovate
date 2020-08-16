import { VersioningApi } from '../common';
export declare const id = "cargo";
export declare const displayName = "Cargo";
export declare const urls: string[];
export declare const supportsRanges = true;
export declare const supportedRangeStrategies: string[];
export declare const isValid: (input: string) => string | boolean;
export declare const api: VersioningApi;
export default api;
