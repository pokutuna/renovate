import { PackageDependency } from '../common';
import { ExtractionResult } from './util';
export declare const sourceExtractionRegex: RegExp;
export declare function extractTerraformProvider(startingLine: number, lines: string[], moduleName: string): ExtractionResult;
export declare function analyzeTerraformProvider(dep: PackageDependency): void;
