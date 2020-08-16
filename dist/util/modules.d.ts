export declare function loadModules<T>(dirname: string, validate?: (module: T, moduleName?: string) => boolean, filter?: (moduleName?: string) => boolean): Record<string, T>;
