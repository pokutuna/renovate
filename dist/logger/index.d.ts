import * as bunyan from 'bunyan';
export interface LogError {
    level: bunyan.LogLevel;
    meta: any;
    msg?: string;
}
interface Logger {
    trace(msg: string): void;
    trace(meta: Record<string, any>, msg?: string): void;
    debug(msg: string): void;
    debug(meta: Record<string, any>, msg?: string): void;
    info(msg: string): void;
    info(meta: Record<string, any>, msg?: string): void;
    warn(msg: string): void;
    warn(meta: Record<string, any>, msg?: string): void;
    error(msg: string): void;
    error(meta: Record<string, any>, msg?: string): void;
    fatal(msg: string): void;
    fatal(meta: Record<string, any>, msg?: string): void;
}
export declare const logger: Logger;
export declare function setContext(value: string): void;
export declare function getContext(): any;
export declare function setMeta(obj: any): void;
export declare function addMeta(obj: any): void;
export declare function removeMeta(fields: string[]): void;
export declare function addStream(stream: bunyan.Stream): void;
export declare function levels(name: string, level: bunyan.LogLevel): void;
export declare function getErrors(): any;
export {};
