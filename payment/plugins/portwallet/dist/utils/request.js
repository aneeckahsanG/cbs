"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.post = exports.get = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const NagadException_1 = require("../exceptions/NagadException");
async function get(url, additionalHeaders) {
    const r = await node_fetch_1.default(url, {
        method: 'GET',
        headers: Object.assign({ 'content-type': 'application/json', Accept: 'application/json' }, additionalHeaders),
    });
    const data = await r.json();
    if (data.reason) {
        throw new NagadException_1.NagadException(data.message);
    }
    return data;
}
exports.get = get;
async function post(url, payload = {}, additionalHeaders) {
    const r = await node_fetch_1.default(url, {
        headers: Object.assign({ 'content-type': 'application/json', Accept: 'application/json' }, additionalHeaders),
        body: JSON.stringify(payload),
        method: 'POST',
    });
    const data = await r.json();
    if (data.reason) {
        throw new NagadException_1.NagadException(data.message);
    }
    return data;
}
exports.post = post;
