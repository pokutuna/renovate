import { HttpError } from './types';
export declare type GotLegacyError<E = unknown, T = unknown> = HttpError & {
    statusCode?: number;
    body: {
        message?: string;
        errors?: E[];
    };
    headers?: Record<string, T>;
};
