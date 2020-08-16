/// <reference types="node" />
import { Stream } from 'stream';
import bunyan from 'bunyan';
export interface BunyanRecord extends Record<string, any> {
    level: number;
    msg: string;
    module?: string;
}
export declare class ErrorStream extends Stream {
    private _errors;
    readable: boolean;
    writable: boolean;
    constructor();
    write(data: BunyanRecord): boolean;
    getErrors(): BunyanRecord[];
}
export declare function withSanitizer(streamConfig: any): bunyan.Stream;
