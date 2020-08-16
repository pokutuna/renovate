declare const REV_TYPE_LATEST = "REV_TYPE_LATEST";
declare const REV_TYPE_SUBREV = "REV_TYPE_SUBREVISION";
declare const REV_TYPE_RANGE = "REV_TYPE_RANGE";
export interface Revision {
    type: typeof REV_TYPE_LATEST | typeof REV_TYPE_RANGE | typeof REV_TYPE_SUBREV;
    value: string;
}
declare function parseDynamicRevision(str: string): Revision;
export { REV_TYPE_LATEST, REV_TYPE_SUBREV, REV_TYPE_RANGE, parseDynamicRevision, };
