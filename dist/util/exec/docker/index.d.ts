import { DockerOptions, ExecConfig } from '../common';
export declare function resetPrefetchedImages(): void;
export declare function removeDockerContainer(image: any): Promise<void>;
export declare function removeDanglingContainers(): Promise<void>;
export declare function generateDockerCommand(commands: string[], options: DockerOptions, config: ExecConfig): Promise<string>;
