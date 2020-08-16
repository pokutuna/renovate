"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSingleOperator = exports.isValidOperator = exports.PGTE = exports.LTE = exports.GTE = exports.LT = exports.GT = exports.NOT_EQUAL = exports.EQUAL = void 0;
const EQUAL = '=';
exports.EQUAL = EQUAL;
const NOT_EQUAL = '!=';
exports.NOT_EQUAL = NOT_EQUAL;
const GT = '>';
exports.GT = GT;
const LT = '<';
exports.LT = LT;
const GTE = '>=';
exports.GTE = GTE;
const LTE = '<=';
exports.LTE = LTE;
const PGTE = '~>';
exports.PGTE = PGTE;
const SINGLE = [EQUAL];
const ALL = [EQUAL, NOT_EQUAL, GT, LT, GTE, LTE, PGTE];
const isValidOperator = (operator) => ALL.includes(operator);
exports.isValidOperator = isValidOperator;
const isSingleOperator = (operator) => SINGLE.includes(operator);
exports.isSingleOperator = isSingleOperator;
//# sourceMappingURL=operator.js.map