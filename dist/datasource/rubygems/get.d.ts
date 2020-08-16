import { ReleaseResult } from '../common';
export declare const getDependency: ({ dependency, registry, }: {
    dependency: any;
    registry: any;
}) => Promise<ReleaseResult | null>;
