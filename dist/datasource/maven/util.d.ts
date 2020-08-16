/// <reference types="node" />
import url from 'url';
export declare function downloadHttpProtocol(pkgUrl: url.URL | string, hostType?: string): Promise<string | null>;
export declare function isHttpResourceExists(pkgUrl: url.URL | string, hostType?: string): Promise<boolean | null>;
