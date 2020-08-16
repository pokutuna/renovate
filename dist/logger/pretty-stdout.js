"use strict";
// Code originally derived from https://github.com/hadfieldn/node-bunyan-prettystream but since heavily edited
// Neither fork nor original repo appear to be maintained
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenovateStream = exports.formatRecord = exports.getDetails = exports.getMeta = exports.indent = void 0;
const stream_1 = require("stream");
const util = __importStar(require("util"));
const chalk_1 = __importDefault(require("chalk"));
const json_stringify_pretty_compact_1 = __importDefault(require("json-stringify-pretty-compact"));
const bunyanFields = [
    'name',
    'hostname',
    'pid',
    'level',
    'v',
    'time',
    'msg',
    'start_time',
];
const metaFields = [
    'repository',
    'packageFile',
    'depType',
    'dependency',
    'dependencies',
    'branch',
];
const levels = {
    10: chalk_1.default.gray('TRACE'),
    20: chalk_1.default.blue('DEBUG'),
    30: chalk_1.default.green(' INFO'),
    40: chalk_1.default.magenta(' WARN'),
    50: chalk_1.default.red('ERROR'),
    60: chalk_1.default.bgRed('FATAL'),
};
function indent(str, leading = false) {
    const prefix = leading ? '       ' : '';
    return prefix + str.split(/\r?\n/).join('\n       ');
}
exports.indent = indent;
function getMeta(rec) {
    if (!rec) {
        return '';
    }
    let res = rec.module ? ` [${rec.module}]` : ``;
    const filteredMeta = metaFields.filter((elem) => rec[elem]);
    if (!filteredMeta.length) {
        return res;
    }
    const metaStr = filteredMeta
        .map((field) => `${field}=${rec[field]}`)
        .join(', ');
    res = ` (${metaStr})${res}`;
    return chalk_1.default.gray(res);
}
exports.getMeta = getMeta;
function getDetails(rec) {
    if (!rec) {
        return '';
    }
    const recFiltered = { ...rec };
    delete recFiltered.module;
    Object.keys(recFiltered).forEach((key) => {
        if (key === 'logContext' ||
            bunyanFields.includes(key) ||
            metaFields.includes(key)) {
            delete recFiltered[key];
        }
    });
    const remainingKeys = Object.keys(recFiltered);
    if (remainingKeys.length === 0) {
        return '';
    }
    return `${remainingKeys
        .map((key) => `${indent(`"${key}": ${json_stringify_pretty_compact_1.default(recFiltered[key])}`, true)}`)
        .join(',\n')}\n`;
}
exports.getDetails = getDetails;
function formatRecord(rec) {
    const level = levels[rec.level];
    const msg = `${indent(rec.msg)}`;
    const meta = getMeta(rec);
    const details = getDetails(rec);
    return util.format('%s: %s%s\n%s', level, msg, meta, details);
}
exports.formatRecord = formatRecord;
class RenovateStream extends stream_1.Stream {
    constructor() {
        super();
        this.readable = true;
        this.writable = true;
    }
    // istanbul ignore next
    write(data) {
        this.emit('data', formatRecord(data));
        return true;
    }
}
exports.RenovateStream = RenovateStream;
//# sourceMappingURL=pretty-stdout.js.map