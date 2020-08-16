import { ManagerConfig, PackageFile } from '../common';
export default function extractPackageFile(_content: string, fileName: string, config: ManagerConfig): Promise<PackageFile | null>;
