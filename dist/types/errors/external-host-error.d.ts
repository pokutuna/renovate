export declare class ExternalHostError extends Error {
    hostType: string;
    err: Error;
    lookupName?: string;
    reason?: string;
    constructor(err: Error, hostType?: string);
}
