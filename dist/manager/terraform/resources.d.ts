import { PackageDependency } from '../common';
import { ExtractionResult, ResourceManagerData } from './util';
export declare function extractTerraformResource(startingLine: number, lines: string[]): ExtractionResult;
export declare function analyseTerraformResource(dep: PackageDependency<ResourceManagerData>): void;
