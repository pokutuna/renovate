"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPackageFile = exports.extractSetupFile = exports.getPythonAlias = exports.parsePythonVersion = exports.resetModule = exports.pythonVersions = void 0;
const datasourcePypi = __importStar(require("../../datasource/pypi"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const exec_1 = require("../../util/exec");
const common_1 = require("../../util/exec/common");
const ignore_1 = require("../../util/ignore");
const extract_1 = require("../pip_requirements/extract");
const util_1 = require("./util");
exports.pythonVersions = ['python', 'python3', 'python3.8'];
let pythonAlias = null;
function resetModule() {
    pythonAlias = null;
}
exports.resetModule = resetModule;
function parsePythonVersion(str) {
    const arr = str.split(' ')[1].split('.');
    return [parseInt(arr[0], 10), parseInt(arr[1], 10)];
}
exports.parsePythonVersion = parsePythonVersion;
async function getPythonAlias() {
    if (pythonAlias) {
        return pythonAlias;
    }
    pythonAlias = exports.pythonVersions[0]; // fallback to 'python'
    for (const pythonVersion of exports.pythonVersions) {
        try {
            const { stdout, stderr } = await exec_1.exec(`${pythonVersion} --version`);
            const version = parsePythonVersion(stdout || stderr);
            if (version[0] >= 3 && version[1] >= 7) {
                pythonAlias = pythonVersion;
            }
        }
        catch (err) {
            logger_1.logger.debug(`${pythonVersion} alias not found`);
        }
    }
    return pythonAlias;
}
exports.getPythonAlias = getPythonAlias;
async function extractSetupFile(_content, packageFile, config) {
    const cwd = config.localDir;
    let cmd = 'python';
    const extractPy = await util_1.copyExtractFile();
    const args = [`"${extractPy}"`, `"${packageFile}"`];
    if (config.binarySource !== common_1.BinarySource.Docker) {
        logger_1.logger.debug('Running python via global command');
        cmd = await getPythonAlias();
    }
    logger_1.logger.debug({ cmd, args }, 'python command');
    const res = await exec_1.exec(`${cmd} ${args.join(' ')}`, {
        cwd,
        timeout: 30000,
        docker: {
            image: 'renovate/pip',
        },
    });
    if (res.stderr) {
        const stderr = res.stderr
            .replace(/.*\n\s*import imp/, '')
            .trim()
            .replace('fatal: No names found, cannot describe anything.', '');
        if (stderr.length) {
            logger_1.logger.warn({ stdout: res.stdout, stderr }, 'Error in read setup file');
        }
    }
    return util_1.parseReport();
}
exports.extractSetupFile = extractSetupFile;
async function extractPackageFile(content, packageFile, config) {
    logger_1.logger.debug('pip_setup.extractPackageFile()');
    let setup;
    try {
        setup = await extractSetupFile(content, packageFile, config);
    }
    catch (err) {
        logger_1.logger.warn({ err, content, packageFile }, 'Failed to read setup.py file');
        return null;
    }
    const requires = [];
    if (setup.install_requires) {
        requires.push(...setup.install_requires);
    }
    if (setup.extras_require) {
        for (const req of Object.values(setup.extras_require)) {
            requires.push(...req);
        }
    }
    const regex = new RegExp(`^${extract_1.dependencyPattern}`);
    const lines = content.split('\n');
    const deps = requires
        .map((req) => {
        const lineNumber = lines.findIndex((l) => l.includes(req));
        if (lineNumber === -1) {
            return null;
        }
        const rawline = lines[lineNumber];
        let dep = {};
        const [, comment] = rawline.split('#').map((part) => part.trim());
        if (ignore_1.isSkipComment(comment)) {
            dep.skipReason = types_1.SkipReason.Ignored;
        }
        regex.lastIndex = 0;
        const matches = regex.exec(req);
        if (!matches) {
            return null;
        }
        const [, depName, , currentValue] = matches;
        dep = {
            ...dep,
            depName,
            currentValue,
            managerData: { lineNumber },
            datasource: datasourcePypi.id,
        };
        return dep;
    })
        .filter(Boolean)
        .sort((a, b) => a.managerData.lineNumber === b.managerData.lineNumber
        ? a.depName.localeCompare(b.depName)
        : a.managerData.lineNumber - b.managerData.lineNumber);
    if (!deps.length) {
        return null;
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map