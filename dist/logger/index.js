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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrors = exports.levels = exports.addStream = exports.removeMeta = exports.addMeta = exports.setMeta = exports.getContext = exports.setContext = exports.logger = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const bunyan = __importStar(require("bunyan"));
const shortid = __importStar(require("shortid"));
const cmd_serializer_1 = __importDefault(require("./cmd-serializer"));
const config_serializer_1 = __importDefault(require("./config-serializer"));
const err_serializer_1 = __importDefault(require("./err-serializer"));
const pretty_stdout_1 = require("./pretty-stdout");
const utils_1 = require("./utils");
let logContext = process.env.LOG_CONTEXT || shortid.generate();
let meta = {};
const errors = new utils_1.ErrorStream();
const stdout = {
    name: 'stdout',
    level: process.env.LOG_LEVEL || 'info',
    stream: process.stdout,
};
if (process.env.LOG_FORMAT !== 'json') {
    // TODO: typings
    const prettyStdOut = new pretty_stdout_1.RenovateStream();
    prettyStdOut.pipe(process.stdout);
    stdout.stream = prettyStdOut;
    stdout.type = 'raw';
}
const bunyanLogger = bunyan.createLogger({
    name: 'renovate',
    serializers: {
        body: config_serializer_1.default,
        cmd: cmd_serializer_1.default,
        config: config_serializer_1.default,
        migratedConfig: config_serializer_1.default,
        originalConfig: config_serializer_1.default,
        presetConfig: config_serializer_1.default,
        oldConfig: config_serializer_1.default,
        newConfig: config_serializer_1.default,
        err: err_serializer_1.default,
    },
    streams: [
        stdout,
        {
            name: 'error',
            level: 'error',
            stream: errors,
            type: 'raw',
        },
    ].map(utils_1.withSanitizer),
});
const logFactory = (level) => {
    return (p1, p2) => {
        if (p2) {
            // meta and msg provided
            bunyanLogger[level]({ logContext, ...meta, ...p1 }, p2);
        }
        else if (is_1.default.string(p1)) {
            // only message provided
            bunyanLogger[level]({ logContext, ...meta }, p1);
        }
        else {
            // only meta provided
            bunyanLogger[level]({ logContext, ...meta, ...p1 });
        }
    };
};
const loggerLevels = [
    'trace',
    'debug',
    'info',
    'warn',
    'error',
    'fatal',
];
exports.logger = {};
loggerLevels.forEach((loggerLevel) => {
    exports.logger[loggerLevel] = logFactory(loggerLevel);
});
function setContext(value) {
    logContext = value;
}
exports.setContext = setContext;
function getContext() {
    return logContext;
}
exports.getContext = getContext;
// setMeta overrides existing meta, may remove fields if no longer existing
function setMeta(obj) {
    meta = { ...obj };
}
exports.setMeta = setMeta;
// addMeta overrides or adds fields but does not remove any
function addMeta(obj) {
    meta = { ...meta, ...obj };
}
exports.addMeta = addMeta;
// removeMeta removes the provided fields from meta
function removeMeta(fields) {
    Object.keys(meta).forEach((key) => {
        if (fields.includes(key)) {
            delete meta[key];
        }
    });
}
exports.removeMeta = removeMeta;
function addStream(stream) {
    bunyanLogger.addStream(utils_1.withSanitizer(stream));
}
exports.addStream = addStream;
function levels(name, level) {
    bunyanLogger.levels(name, level);
}
exports.levels = levels;
function getErrors() {
    return errors.getErrors();
}
exports.getErrors = getErrors;
//# sourceMappingURL=index.js.map