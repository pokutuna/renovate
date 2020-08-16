"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.getCliName = void 0;
const commander_1 = require("commander");
const package_json_1 = require("../../package.json");
const definitions_1 = require("./definitions");
function getCliName(option) {
    if (option.cli === false) {
        return '';
    }
    const nameWithHyphens = option.name.replace(/([A-Z])/g, '-$1');
    return `--${nameWithHyphens.toLowerCase()}`;
}
exports.getCliName = getCliName;
function getConfig(input) {
    // massage migrated configuration keys
    const argv = input
        .map((a) => a
        .replace('--endpoints=', '--host-rules=')
        .replace('--expose-env=true', '--trust-level=high')
        .replace('--expose-env', '--trust-level=high')
        .replace('--renovate-fork', '--include-forks')
        .replace('"platform":"', '"hostType":"')
        .replace('"endpoint":"', '"baseUrl":"')
        .replace('"host":"', '"hostName":"'))
        .filter((a) => !a.startsWith('--git-fs'));
    const options = definitions_1.getOptions();
    const config = {};
    const coersions = {
        boolean: (val) => {
            if (val === 'true' || val === '') {
                return true;
            }
            if (val === 'false') {
                return false;
            }
            throw new Error("Invalid boolean value: expected 'true' or 'false', but got '" +
                val +
                "'");
        },
        array: (val) => {
            if (val === '') {
                return [];
            }
            try {
                return JSON.parse(val);
            }
            catch (err) {
                return val.split(',').map((el) => el.trim());
            }
        },
        object: (val) => {
            if (val === '') {
                return {};
            }
            try {
                return JSON.parse(val);
            }
            catch (err) {
                throw new Error("Invalid JSON value: '" + val + "'");
            }
        },
        string: (val) => val,
        integer: parseInt,
    };
    let program = new commander_1.Command()
        .storeOptionsAsProperties(false)
        .passCommandToAction(false)
        .arguments('[repositories...]');
    options.forEach((option) => {
        if (option.cli !== false) {
            const param = `<${option.type}>`.replace('<boolean>', '[boolean]');
            const optionString = `${getCliName(option)} ${param}`;
            program = program.option(optionString, option.description, coersions[option.type]);
        }
    });
    /* istanbul ignore next */
    function helpConsole() {
        /* eslint-disable no-console */
        console.log('  Examples:');
        console.log('');
        console.log('    $ renovate --token abc123 singapore/lint-condo');
        console.log('    $ renovate --labels=renovate,dependency --ignore-unstable=false --log-level debug singapore/lint-condo');
        console.log('    $ renovate singapore/lint-condo singapore/package-test');
        console.log(`    $ renovate singapore/lint-condo --onboarding-config='{"extends":["config:base"]}'`);
        /* eslint-enable no-console */
    }
    program = program
        .version(package_json_1.version, '-v, --version')
        .on('--help', helpConsole)
        .action((repositories, opts) => {
        if (repositories === null || repositories === void 0 ? void 0 : repositories.length) {
            config.repositories = repositories;
        }
        for (const option of options) {
            if (option.cli !== false) {
                if (opts[option.name] !== undefined) {
                    config[option.name] = opts[option.name];
                }
            }
        }
    })
        .parse(argv);
    return config;
}
exports.getConfig = getConfig;
//# sourceMappingURL=cli.js.map