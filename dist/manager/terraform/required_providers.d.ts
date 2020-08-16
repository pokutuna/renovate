import { ExtractionResult } from './util';
export declare const providerBlockExtractionRegex: RegExp;
export declare function extractTerraformRequiredProviders(startingLine: number, lines: string[]): ExtractionResult;
