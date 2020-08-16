/**
 * Cache callback result which has to be returned by the `CacheCallback` function.
 */
export interface CacheResult<TResult = unknown> {
    /**
     * The data which should be added to the cache
     */
    data: TResult;
    /**
     * `data` can only be cached if this is not `true`
     */
    isPrivate?: boolean;
}
/**
 * Simple helper type for defining the `CacheCallback` function return type
 */
export declare type CachePromise<TResult = unknown> = Promise<CacheResult<TResult>>;
/**
 * The callback function which is called on cache miss.
 */
export declare type CacheCallback<TArg, TResult = unknown> = (lookup: TArg) => CachePromise<TResult>;
export declare type CacheConfig<TArg, TResult> = {
    /**
     * Datasource id
     */
    id: string;
    /**
     * Cache key
     */
    lookup: TArg;
    /**
     * Callback to use on cache miss to load result
     */
    cb: CacheCallback<TArg, TResult>;
    /**
     * Time to cache result in minutes
     */
    minutes?: number;
};
/**
 * Loads result from cache or from passed callback on cache miss.
 * @param param0 Cache config args
 */
export declare function cacheAble<TArg, TResult = unknown>({ id, lookup, cb, minutes, }: CacheConfig<TArg, TResult>): Promise<TResult>;
