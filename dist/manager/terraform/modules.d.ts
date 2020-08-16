import { PackageDependency } from '../common';
import { ExtractionResult } from './util';
export declare function extractTerraformModule(startingLine: number, lines: string[], moduleName: string): ExtractionResult;
export declare function analyseTerraformModule(dep: PackageDependency): void;
