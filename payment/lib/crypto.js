'use strict';

const crypto = require('crypto');

const encrypt = (text) => {
    
    const cipher = crypto.createCipheriv(process.env.CRYPTO_ALGO, process.env.CRYPTO_SECRET_KEY, process.env.CRYPTO_IV);

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return encrypted.toString('hex');

};

const decrypt = (hash) => {

    const decipher = crypto.createDecipheriv(process.env.CRYPTO_ALGO, process.env.CRYPTO_SECRET_KEY, process.env.CRYPTO_IV);

    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash, 'hex')), decipher.final()]);

    return decrpyted.toString();
};

module.exports = {
    encrypt,
    decrypt
};