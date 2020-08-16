/// <reference types="node" />
import { Stats } from 'fs';
import { ExtractConfig } from '../common';
export declare const extraEnv: {
    GRADLE_OPTS: string;
};
export declare function gradleWrapperFileName(config: ExtractConfig): string;
export declare function prepareGradleCommand(gradlewName: string, cwd: string, gradlew: Stats | null, args: string | null): Promise<string>;
