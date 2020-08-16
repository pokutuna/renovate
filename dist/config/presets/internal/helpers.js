"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presets = void 0;
exports.presets = {
    disableTypesNodeMajor: {
        packageRules: [
            {
                packageNames: ['@types/node'],
                major: {
                    enabled: false,
                },
            },
        ],
    },
    oddIsUnstable: {
        description: 'DEPRECATED: Odd version numbers are classified as unstable',
    },
    oddIsUnstablePackages: {
        description: 'DEPRECATED: Preconfigure dependencies where an odd major version indicates unstable (Docker-only)',
    },
    followTypescriptNext: {
        description: 'Keep <typescript> version in sync with the <code>next</code> tag',
        extends: [':followTag(typescript, next)'],
    },
    followTypescriptRc: {
        description: 'Keep <typescript> version in sync with the <code>rc</code> tag',
        extends: [':followTag(typescript, rc)'],
    },
};
//# sourceMappingURL=helpers.js.map