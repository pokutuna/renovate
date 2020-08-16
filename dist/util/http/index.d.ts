/// <reference types="node" />
import './legacy';
export * from './types';
interface OutgoingHttpHeaders {
    [header: string]: number | string | string[] | undefined;
}
export interface HttpOptions {
    body?: any;
    username?: string;
    password?: string;
    baseUrl?: string;
    headers?: OutgoingHttpHeaders;
    throwHttpErrors?: boolean;
    useCache?: boolean;
}
export interface HttpPostOptions extends HttpOptions {
    body: unknown;
}
export interface InternalHttpOptions extends HttpOptions {
    json?: object;
    responseType?: 'json';
    method?: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head';
}
export interface HttpResponse<T = string> {
    body: T;
    headers: any;
}
export declare class Http<GetOptions = HttpOptions, PostOptions = HttpPostOptions> {
    private hostType;
    private options?;
    constructor(hostType: string, options?: HttpOptions);
    protected request<T>(requestUrl: string | URL, httpOptions?: InternalHttpOptions): Promise<HttpResponse<T> | null>;
    get(url: string, options?: HttpOptions): Promise<HttpResponse>;
    head(url: string, options?: HttpOptions): Promise<HttpResponse>;
    private requestJson;
    getJson<T = unknown>(url: string, options?: GetOptions): Promise<HttpResponse<T>>;
    headJson<T = unknown>(url: string, options?: GetOptions): Promise<HttpResponse<T>>;
    postJson<T = unknown>(url: string, options?: PostOptions): Promise<HttpResponse<T>>;
    putJson<T = unknown>(url: string, options?: PostOptions): Promise<HttpResponse<T>>;
    patchJson<T = unknown>(url: string, options?: PostOptions): Promise<HttpResponse<T>>;
    deleteJson<T = unknown>(url: string, options?: PostOptions): Promise<HttpResponse<T>>;
    stream(url: string, options?: HttpOptions): NodeJS.ReadableStream;
}
