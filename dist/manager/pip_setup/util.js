"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseReport = exports.copyExtractFile = void 0;
const util_1 = require("../../util");
const fs_1 = require("../../util/fs");
// need to match filename in `data/extract.py`
const REPORT = 'renovate-pip_setup-report.json';
const EXTRACT = 'renovate-pip_setup-extract.py';
let extractPy;
async function copyExtractFile() {
    if (extractPy === undefined) {
        const file = await util_1.resolveFile('data/extract.py');
        extractPy = await fs_1.readFile(file, 'utf8');
    }
    await fs_1.writeLocalFile(EXTRACT, extractPy);
    return EXTRACT;
}
exports.copyExtractFile = copyExtractFile;
async function parseReport() {
    const data = await fs_1.readLocalFile(REPORT, 'utf8');
    return JSON.parse(data);
}
exports.parseReport = parseReport;
//# sourceMappingURL=util.js.map