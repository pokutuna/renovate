import { NewValueConfig } from '../common';
declare function toSemverRange(range: string): string;
declare function getNewValue({ currentValue, fromVersion, toVersion, }: NewValueConfig): string;
export { toSemverRange, getNewValue };
