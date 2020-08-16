"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withSanitizer = exports.ErrorStream = void 0;
const stream_1 = require("stream");
const bunyan_1 = __importDefault(require("bunyan"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const sanitize_1 = require("../util/sanitize");
const excludeProps = ['pid', 'time', 'v', 'hostname'];
class ErrorStream extends stream_1.Stream {
    constructor() {
        super();
        this._errors = [];
        this.readable = false;
        this.writable = true;
    }
    write(data) {
        const err = { ...data };
        for (const prop of excludeProps) {
            delete err[prop];
        }
        this._errors.push(err);
        return true;
    }
    getErrors() {
        return this._errors;
    }
}
exports.ErrorStream = ErrorStream;
const templateFields = ['prBody'];
const contentFields = [
    'content',
    'contents',
    'packageLockParsed',
    'yarnLockParsed',
];
function sanitizeValue(value, seen = new WeakMap()) {
    if (Array.isArray(value)) {
        const length = value.length;
        const arrayResult = Array(length);
        seen.set(value, arrayResult);
        for (let idx = 0; idx < length; idx += 1) {
            const val = value[idx];
            arrayResult[idx] = seen.has(val)
                ? seen.get(val)
                : sanitizeValue(val, seen);
        }
        return arrayResult;
    }
    if (value instanceof Buffer) {
        return '[content]';
    }
    const valueType = typeof value;
    if (value != null && valueType !== 'function' && valueType === 'object') {
        if (value instanceof Date) {
            return value;
        }
        const objectResult = {};
        seen.set(value, objectResult);
        for (const [key, val] of Object.entries(value)) {
            let curValue;
            if (sanitize_1.redactedFields.includes(key)) {
                curValue = '***********';
            }
            else if (contentFields.includes(key)) {
                curValue = '[content]';
            }
            else if (templateFields.includes(key)) {
                curValue = '[Template]';
            }
            else {
                curValue = seen.has(val) ? seen.get(val) : sanitizeValue(val, seen);
            }
            objectResult[key] = curValue;
        }
        return objectResult;
    }
    return valueType === 'string' ? sanitize_1.sanitize(value) : value;
}
function withSanitizer(streamConfig) {
    if (streamConfig.type === 'rotating-file') {
        throw new Error("Rotating files aren't supported");
    }
    const stream = streamConfig.stream;
    if (stream === null || stream === void 0 ? void 0 : stream.writable) {
        const write = (chunk, enc, cb) => {
            const raw = sanitizeValue(chunk);
            const result = streamConfig.type === 'raw'
                ? raw
                : JSON.stringify(raw, bunyan_1.default.safeCycles()).replace(/\n?$/, '\n');
            stream.write(result, enc, cb);
        };
        return {
            ...streamConfig,
            type: 'raw',
            stream: { write },
        };
    }
    if (streamConfig.path) {
        const fileStream = fs_extra_1.default.createWriteStream(streamConfig.path, {
            flags: 'a',
            encoding: 'utf8',
        });
        return withSanitizer({ ...streamConfig, stream: fileStream });
    }
    throw new Error("Missing 'stream' or 'path' for bunyan stream");
}
exports.withSanitizer = withSanitizer;
//# sourceMappingURL=utils.js.map