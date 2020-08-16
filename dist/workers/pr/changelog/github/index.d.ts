import { ChangeLogFile, ChangeLogNotes } from '../common';
export declare function getTags(endpoint: string, repository: string): Promise<string[]>;
export declare function getReleaseNotesMd(repository: string, apiBaseUrl: string): Promise<ChangeLogFile> | null;
export declare function getReleaseList(apiBaseUrl: string, repository: string): Promise<ChangeLogNotes[]>;
