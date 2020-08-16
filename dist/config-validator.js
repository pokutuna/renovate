#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// istanbul ignore file
const fs_extra_1 = require("fs-extra");
const json5_1 = __importDefault(require("json5"));
const app_strings_1 = require("./config/app-strings");
const file_1 = require("./config/file");
const massage_1 = require("./config/massage");
const validation_1 = require("./config/validation");
/* eslint-disable no-console */
let returnVal = 0;
async function validate(desc, config, isPreset = false) {
    const res = await validation_1.validateConfig(massage_1.massageConfig(config), isPreset);
    if (res.errors.length) {
        console.log(`${desc} contains errors:\n\n${JSON.stringify(res.errors, null, 2)}`);
        returnVal = 1;
    }
    if (res.warnings.length) {
        console.log(`${desc} contains warnings:\n\n${JSON.stringify(res.warnings, null, 2)}`);
        returnVal = 1;
    }
}
(async () => {
    for (const file of app_strings_1.configFileNames.filter((name) => name !== 'package.json')) {
        try {
            const rawContent = fs_extra_1.readFileSync(file, 'utf8');
            console.log(`Validating ${file}`);
            try {
                let jsonContent;
                if (file.endsWith('.json5')) {
                    jsonContent = json5_1.default.parse(rawContent);
                }
                else {
                    jsonContent = JSON.parse(rawContent);
                }
                await validate(file, jsonContent);
            }
            catch (err) {
                console.log(`${file} is not valid Renovate config`, err);
                returnVal = 1;
            }
        }
        catch (err) {
            // file does not exist
        }
    }
    try {
        const pkgJson = JSON.parse(fs_extra_1.readFileSync('package.json', 'utf8'));
        if (pkgJson.renovate) {
            console.log(`Validating package.json > renovate`);
            await validate('package.json > renovate', pkgJson.renovate);
        }
        if (pkgJson['renovate-config']) {
            console.log(`Validating package.json > renovate-config`);
            for (const presetConfig of Object.values(pkgJson['renovate-config'])) {
                await validate('package.json > renovate-config', presetConfig, true);
            }
        }
    }
    catch (err) {
        // ignore
    }
    try {
        const fileConfig = file_1.getConfig(process.env);
        console.log(`Validating config.js`);
        try {
            await validate('config.js', fileConfig);
        }
        catch (err) {
            console.log(`config.js is not valid Renovate config`);
            returnVal = 1;
        }
    }
    catch (err) {
        // ignore
    }
    if (returnVal !== 0) {
        process.exit(returnVal);
    }
    console.log('OK');
})().catch((e) => {
    console.error(e);
    process.exit(99);
});
//# sourceMappingURL=config-validator.js.map