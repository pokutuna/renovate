import { PackageDependency, PackageFile } from '../common';
interface Image {
    name: string;
    newTag: string;
}
interface Kustomize {
    kind: string;
    bases: string[];
    images: Image[];
}
export declare function extractBase(base: string): PackageDependency | null;
export declare function extractImage(image: Image): PackageDependency | null;
export declare function parseKustomize(content: string): Kustomize | null;
export declare function extractPackageFile(content: string): PackageFile | null;
export {};
