/// <reference types="node" />
import { URL } from 'url';
import { Http, HttpOptions, HttpResponse, InternalHttpOptions } from '.';
export declare const setBaseUrl: (url: string) => void;
export declare class BitbucketHttp extends Http {
    constructor(options?: HttpOptions);
    protected request<T>(url: string | URL, options?: InternalHttpOptions): Promise<HttpResponse<T> | null>;
}
