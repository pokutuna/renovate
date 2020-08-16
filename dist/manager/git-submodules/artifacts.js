"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function updateArtifacts({ updatedDeps, }) {
    return [
        {
            file: {
                name: updatedDeps[0],
                contents: '',
            },
        },
    ];
}
exports.default = updateArtifacts;
//# sourceMappingURL=artifacts.js.map