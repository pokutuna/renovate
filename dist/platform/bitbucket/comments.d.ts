import { EnsureCommentConfig } from '../common';
import { Config } from './utils';
export declare type CommentsConfig = Pick<Config, 'repository'>;
interface EnsureBitBucketCommentConfig extends EnsureCommentConfig {
    config: CommentsConfig;
}
export declare function ensureComment({ config, number: prNo, topic, content, }: EnsureBitBucketCommentConfig): Promise<boolean>;
export declare function ensureCommentRemoval(config: CommentsConfig, prNo: number, topic?: string, content?: string): Promise<void>;
export {};
