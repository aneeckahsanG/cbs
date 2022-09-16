'use strict';

const log4js = require('log4js');
const path = './logs';

const logEnabled = process.env.LOG_ENABLED;

function getLevel(level) {
    if (logEnabled === 'true') {
        return level;
    } else {
        return 'off';
    }
}

log4js.configure({
    appenders: {
        debug: {
            type: 'dateFile',
            filename: path + '/debug.log'
        },
        error: {
            type: 'file',
            filename: path + '/error.log'
        }
    },
    categories: {
        error: {
            appenders: ['error'],
            level: getLevel('error')
        },
        debug: {
            appenders: ['debug'],
            level: getLevel('debug')
        },
        default: {
            appenders: ['debug'],
            level: getLevel('debug')   
        }
    }
});

module.exports = {
    debug: log4js.getLogger('debug'),
    error: log4js.getLogger('error')
}