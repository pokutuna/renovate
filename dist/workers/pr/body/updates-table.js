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
exports.getPrUpdatesTable = void 0;
const logger_1 = require("../../../logger");
const template = __importStar(require("../../../util/template"));
function getTableDefinition(config) {
    const res = [];
    for (const header of config.prBodyColumns) {
        const value = config.prBodyDefinitions[header];
        res.push({ header, value });
    }
    return res;
}
function getNonEmptyColumns(definitions, rows) {
    var _a;
    const res = [];
    for (const column of definitions) {
        const { header } = column;
        for (const row of rows) {
            if ((_a = row[header]) === null || _a === void 0 ? void 0 : _a.length) {
                if (!res.includes(header)) {
                    res.push(header);
                }
            }
        }
    }
    return res;
}
function getPrUpdatesTable(config) {
    const tableDefinitions = getTableDefinition(config);
    const tableValues = config.upgrades.map((upgrade) => {
        const res = {};
        for (const column of tableDefinitions) {
            const { header, value } = column;
            try {
                // istanbul ignore else
                if (value) {
                    res[header] = template.compile(value, upgrade).replace(/^``$/, '');
                }
                else {
                    res[header] = '';
                }
            }
            catch (err) /* istanbul ignore next */ {
                logger_1.logger.warn({ header, value, err }, 'Handlebars compilation error');
            }
        }
        return res;
    });
    const tableColumns = getNonEmptyColumns(tableDefinitions, tableValues);
    let res = '\n\nThis PR contains the following updates:\n\n';
    res += '| ' + tableColumns.join(' | ') + ' |\n';
    res += '|' + tableColumns.map(() => '---|').join('') + '\n';
    const rows = [];
    for (const row of tableValues) {
        let val = '|';
        for (const column of tableColumns) {
            const content = row[column]
                ? row[column].replace(/^@/, '@&#8203;').replace(/\|/g, '\\|')
                : '';
            val += ` ${content} |`;
        }
        val += '\n';
        rows.push(val);
    }
    const uniqueRows = [...new Set(rows)];
    res += uniqueRows.join('');
    res += '\n\n';
    return res;
}
exports.getPrUpdatesTable = getPrUpdatesTable;
//# sourceMappingURL=updates-table.js.map