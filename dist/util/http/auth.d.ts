import { NormalizedOptions } from 'got';
import { GotOptions } from './types';
export declare function applyAuthorization(inOptions: GotOptions): GotOptions;
export declare function removeAuthorization(options: NormalizedOptions): void;
