/// <reference types="node" />
import { Http, HttpResponse, InternalHttpOptions } from '.';
export declare const setBaseUrl: (url: string) => void;
interface GithubInternalOptions extends InternalHttpOptions {
    body?: string;
}
export interface GithubHttpOptions extends InternalHttpOptions {
    paginate?: boolean | string;
    pageLimit?: number;
    token?: string;
}
interface GraphqlOptions {
    paginate?: boolean;
    count?: number;
    acceptHeader?: string;
    fromEnd?: boolean;
}
export declare class GithubHttp extends Http<GithubHttpOptions, GithubHttpOptions> {
    constructor(options?: GithubHttpOptions);
    protected request<T>(url: string | URL, options?: GithubInternalOptions & GithubHttpOptions, okToRetry?: boolean): Promise<HttpResponse<T> | null>;
    queryRepo<T = unknown>(query: string, options?: GraphqlOptions): Promise<T>;
    queryRepoField<T = Record<string, unknown>>(queryOrig: string, fieldName: string, options?: GraphqlOptions): Promise<T[]>;
}
export {};
