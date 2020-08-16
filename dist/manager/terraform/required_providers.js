"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTerraformRequiredProviders = exports.providerBlockExtractionRegex = void 0;
const util_1 = require("./util");
exports.providerBlockExtractionRegex = /^\s*(?<key>[^\s]+)\s+=\s+{/;
function extractBlock(lineNum, lines, dep) {
    let lineNumber = lineNum;
    let line;
    do {
        lineNumber += 1;
        line = lines[lineNumber];
        const kvMatch = util_1.keyValueExtractionRegex.exec(line);
        if (kvMatch) {
            /* eslint-disable no-param-reassign */
            switch (kvMatch.groups.key) {
                case 'source':
                    dep.managerData.source = kvMatch.groups.value;
                    break;
                case 'version':
                    dep.currentValue = kvMatch.groups.value;
                    break;
                /* istanbul ignore next */
                default:
                    break;
            }
            /* eslint-enable no-param-reassign */
        }
    } while (line.trim() !== '}');
    return lineNumber;
}
function extractTerraformRequiredProviders(startingLine, lines) {
    let lineNumber = startingLine;
    let line;
    const deps = [];
    do {
        const dep = {
            managerData: {
                terraformDependencyType: util_1.TerraformDependencyTypes.required_providers,
            },
        };
        lineNumber += 1;
        line = lines[lineNumber];
        const kvMatch = util_1.keyValueExtractionRegex.exec(line);
        if (kvMatch) {
            dep.currentValue = kvMatch.groups.value;
            dep.managerData.moduleName = kvMatch.groups.key;
            deps.push(dep);
        }
        else {
            const nameMatch = exports.providerBlockExtractionRegex.exec(line);
            if (nameMatch === null || nameMatch === void 0 ? void 0 : nameMatch.groups) {
                dep.managerData.moduleName = nameMatch.groups.key;
                lineNumber = extractBlock(lineNumber, lines, dep);
                deps.push(dep);
            }
        }
    } while (line.trim() !== '}');
    return { lineNumber, dependencies: deps };
}
exports.extractTerraformRequiredProviders = extractTerraformRequiredProviders;
//# sourceMappingURL=required_providers.js.map