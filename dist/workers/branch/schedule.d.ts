import { RenovateConfig } from '../../config';
export declare function hasValidTimezone(timezone: string): [boolean] | [boolean, string];
export declare function hasValidSchedule(schedule: string[] | null | 'at any time'): [boolean] | [boolean, string];
export declare function isScheduledNow(config: RenovateConfig): boolean;
