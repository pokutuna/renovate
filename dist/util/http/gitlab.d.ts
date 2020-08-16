/// <reference types="node" />
import { URL } from 'url';
import { Http, HttpResponse, InternalHttpOptions } from '.';
export declare const setBaseUrl: (url: string) => void;
interface GitlabInternalOptions extends InternalHttpOptions {
    body?: string;
}
export interface GitlabHttpOptions extends InternalHttpOptions {
    paginate?: boolean;
    token?: string;
}
export declare class GitlabHttp extends Http<GitlabHttpOptions, GitlabHttpOptions> {
    constructor(options?: GitlabHttpOptions);
    protected request<T>(url: string | URL, options?: GitlabInternalOptions & GitlabHttpOptions): Promise<HttpResponse<T> | null>;
}
export {};
