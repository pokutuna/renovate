import { ChangeLogFile, ChangeLogNotes, ChangeLogResult } from './common';
export declare function getReleaseList(apiBaseUrl: string, repository: string): Promise<ChangeLogNotes[]>;
export declare function getCachedReleaseList(apiBaseUrl: string, repository: string): Promise<ChangeLogNotes[]>;
export declare function massageBody(input: string | undefined | null, baseUrl: string): string;
export declare function getReleaseNotes(repository: string, version: string, depName: string, baseUrl: string, apiBaseUrl: string): Promise<ChangeLogNotes | null>;
export declare function getReleaseNotesMdFileInner(repository: string, apiBaseUrl: string): Promise<ChangeLogFile> | null;
export declare function getReleaseNotesMdFile(repository: string, apiBaseUrl: string): Promise<ChangeLogFile> | null;
export declare function getReleaseNotesMd(repository: string, version: string, baseUrl: string, apiBaseUrl: string): Promise<ChangeLogNotes | null>;
export declare function addReleaseNotes(input: ChangeLogResult): Promise<ChangeLogResult>;
