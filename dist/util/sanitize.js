"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clear = exports.add = exports.sanitize = exports.redactedFields = void 0;
const secrets = new Set();
exports.redactedFields = [
    'authorization',
    'token',
    'githubAppKey',
    'npmToken',
    'npmrc',
    'yarnrc',
    'privateKey',
    'gitPrivateKey',
    'forkToken',
    'password',
];
function sanitize(input) {
    if (!input) {
        return input;
    }
    let output = input;
    secrets.forEach((secret) => {
        while (output.includes(secret)) {
            output = output.replace(secret, '**redacted**');
        }
    });
    return output;
}
exports.sanitize = sanitize;
function add(secret) {
    secrets.add(secret);
}
exports.add = add;
function clear() {
    secrets.clear();
}
exports.clear = clear;
//# sourceMappingURL=sanitize.js.map