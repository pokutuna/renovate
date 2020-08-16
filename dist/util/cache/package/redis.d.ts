export declare function end(): void;
export declare function get<T = never>(namespace: string, key: string): Promise<T>;
export declare function set(namespace: string, key: string, value: unknown, ttlMinutes?: number): Promise<void>;
export declare function init(url: string): void;
