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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const request_1 = require("./utils/request");
class NagadGateway {
    constructor(config) {
        this.handleCallBack = () => {
            //todo
        };
        this.verifyPayment = async (paymentRefID) => {
            return await request_1.get(`${this.baseURL}/api/dfs/verify/payment/${paymentRefID}`, this.headers);
        };
        this.confirmPayment = async (data, clientType) => {
            const { amount, challenge, ip, orderId, paymentReferenceId, productDetails } = data;
            const sensitiveData = {
                merchantId: this.merchantID,
                orderId,
                amount,
                currencyCode: '050',
                challenge,
            };
            const payload = {
                paymentRefId: paymentReferenceId,
                sensitiveData: this.encrypt(sensitiveData),
                signature: this.sign(sensitiveData),
                merchantCallbackURL: this.callbackURL,
                additionalMerchantInfo: Object.assign({}, productDetails),
            };
            const newIP = ip === '::1' || ip === '127.0.0.1' ? '103.100.102.100' : ip;
            return await request_1.post(`${this.baseURL}/api/dfs/check-out/complete/${paymentReferenceId}`, payload, Object.assign(Object.assign({}, this.headers), { 'X-KM-IP-V4': newIP, 'X-KM-Client-Type': clientType }));
        };
        this.encrypt = (data) => {
            const signerObject = crypto.publicEncrypt({ key: this.pubKey, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(JSON.stringify(data)));
            return signerObject.toString('base64');
        };
        this.decrypt = (data) => {
            const decrtypted = crypto
                .privateDecrypt({ key: this.privKey, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(data, 'base64'))
                .toString();
            return JSON.parse(decrtypted);
        };
        this.sign = (data) => {
            const signerObject = crypto.createSign('SHA256');
            signerObject.update(JSON.stringify(data));
            signerObject.end();
            const signed = signerObject.sign(this.privKey, 'base64');
            return signed;
        };
        this.date = () => {
            const now = new Date();
            const day = `${now.getDate()}`.length === 1 ? `0${now.getDate()}` : `${now.getDate()}`;
            const hour = `${now.getHours()}`.length === 1 ? `0${now.getHours()}` : `${now.getHours()}`;
            const minute = `${now.getMinutes()}`.length === 1 ? `0${now.getMinutes()}` : `${now.getMinutes()}`;
            const second = `${now.getSeconds()}`.length === 1 ? `0${now.getSeconds()}` : `${now.getSeconds()}`;
            const month = now.getMonth() + 1 < 10 ? `0${now.getMonth() + 1}` : `${now.getMonth()}`;
            const year = now.getFullYear();
            return `${year}${month}${day}${hour}${minute}${second}`;
        };
        this.createHash = (string) => {
            return crypto.createHash('sha1').update(string).digest('hex').toUpperCase();
        };
        this.genKeys = (privKeyPath, pubKeyPath, isPath) => {
            if (!isPath) {
                return { publicKey: this.formatKey(pubKeyPath, 'PUBLIC'), privateKey: this.formatKey(privKeyPath, 'PRIVATE') };
            }
            const fsPrivKey = fs.readFileSync(privKeyPath, { encoding: 'utf-8' });
            const fsPubKey = fs.readFileSync(pubKeyPath, { encoding: 'utf-8' });
            return { publicKey: this.formatKey(fsPubKey, 'PUBLIC'), privateKey: this.formatKey(fsPrivKey, 'PRIVATE') };
        };
        this.formatKey = (key, type) => {
            if (type === 'PRIVATE') {
                return /begin/i.test(key) ? key.trim() : `-----BEGIN PRIVATE KEY-----\n${key.trim()}\n-----END PRIVATE KEY-----`;
            }
            if (type === 'PUBLIC') {
                return /begin/i.test(key) ? key.trim() : `-----BEGIN PUBLIC KEY-----\n${key.trim()}\n-----END PUBLIC KEY-----`;
            }
        };
        const { baseURL, callbackURL, merchantID, merchantNumber, privKey, pubKey, apiVersion, isPath } = config;
        this.baseURL = baseURL;
        this.merchantID = merchantID;
        this.merchantNumber = merchantNumber;
        this.headers = {
            'X-KM-Api-Version': apiVersion,
        };
        this.callbackURL = callbackURL;
        const { privateKey, publicKey } = this.genKeys(privKey, pubKey, isPath);
        this.privKey = privateKey;
        this.pubKey = publicKey;
    }
    /**
     * ## Initiate a Payment from nagad
     *
     * @param createPaymentConfig Arguments for payment creation
     * @example
     * ```javascript
     * const paymentConfig: ICreatePaymentArgs = {
     *   amount: '100',
     *   ip: '10.10.0.10',
     *   orderId: '12111243GD',
     *   productDetails: { a: '1', b: '2' },
     *   clientType: 'PC_WEB',
     * };
     * const paymentURL = await nagad .createPayment(paymentConfig);
     * ```
     * @returns `Payment URL for nagad`
     *
     */
    async createPayment(createPaymentConfig) {
        const { amount, ip, orderId, productDetails, clientType } = createPaymentConfig;
        const endpoint = `${this.baseURL}/api/dfs/check-out/initialize/${this.merchantID}/${orderId}`;
        const timestamp = this.date();
        const sensitive = {
            merchantId: this.merchantID,
            datetime: timestamp,
            orderId,
            challenge: this.createHash(orderId),
        };
        const payload = {
            accountNumber: this.merchantNumber,
            dateTime: timestamp,
            sensitiveData: this.encrypt(sensitive),
            signature: this.sign(sensitive),
        };
        const newIP = ip === '::1' || ip === '127.0.0.1' ? '103.100.200.100' : ip;
        const { sensitiveData } = await request_1.post(endpoint, payload, Object.assign(Object.assign({}, this.headers), { 'X-KM-IP-V4': newIP, 'X-KM-Client-Type': clientType }));
        const decrypted = this.decrypt(sensitiveData);
        const { paymentReferenceId, challenge } = decrypted;
        const confirmArgs = {
            paymentReferenceId,
            challenge,
            orderId,
            amount,
            productDetails,
            ip: newIP,
        };
        const { callBackUrl } = await this.confirmPayment(confirmArgs, clientType);
        return callBackUrl;
    }
}
module.exports = NagadGateway;
