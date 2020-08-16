import { ReleaseResult } from '../common';
export declare function resetCache(): void;
export declare function getRubygemsOrgDependency(lookupName: string): Promise<ReleaseResult | null>;
