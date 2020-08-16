import { HostRule } from '../../types';
export declare function findAllAuthenticatable({ hostType, }: {
    hostType: string;
}): HostRule[];
export declare function getDomain(hostRule: HostRule): string;
export declare function getAuthenticationHeaderValue(hostRule: HostRule): string;
