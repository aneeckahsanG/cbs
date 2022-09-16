'use strict';

const bluebird  = require('bluebird');
const redis     = bluebird.promisifyAll(require('redis'));

const config = require('../config');

module.exports = async () => {

    let redisClient;
    let gSessExpiration;

    async function initialize(options) {
        if (!options) throw new Error('Undefined options');
            
            const op = {};
            op['host'] = options.host;
            op['port'] = options.port;

            const reload = options.reload !== undefined ? options.reload : false;
            delete options.reload;
      
            gSessExpiration = options.sessExpiration || 0;
            redisClient = redis.createClient(op);

            redisClient.on('error', (err) => {
              console.log(err);
        });
    }

    await initialize(config.redis);

    return {
        redisClient: redisClient
    }
}