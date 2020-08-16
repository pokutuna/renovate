/// <reference types="node" />
import * as fs from 'fs-extra';
import { MoveOptions, WriteFileOptions } from 'fs-extra';
export declare function stat(path: string | Buffer): Promise<fs.Stats>;
export declare function chmod(path: string | Buffer, mode: string | number): Promise<void>;
export declare function readFile(fileName: string): Promise<Buffer>;
export declare function readFile(fileName: string, encoding: 'utf8'): Promise<string>;
export declare function writeFile(fileName: string, fileContent: string): Promise<void>;
export declare function outputFile(file: string, data: any, options?: WriteFileOptions | string): Promise<void>;
export declare function remove(dir: string): Promise<void>;
export declare function unlink(path: string | Buffer): Promise<void>;
export declare function exists(path: string): Promise<boolean>;
export declare function pathExists(path: string): Promise<boolean>;
export declare function move(src: string, dest: string, options?: MoveOptions): Promise<void>;
