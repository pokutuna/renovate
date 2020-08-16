/// <reference types="node" />
import { Stream } from 'stream';
import { BunyanRecord } from './utils';
export declare function indent(str: string, leading?: boolean): string;
export declare function getMeta(rec: BunyanRecord): string;
export declare function getDetails(rec: BunyanRecord): string;
export declare function formatRecord(rec: BunyanRecord): string;
export declare class RenovateStream extends Stream {
    readable: boolean;
    writable: boolean;
    constructor();
    write(data: BunyanRecord): boolean;
}
