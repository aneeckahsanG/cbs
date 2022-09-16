'use strict';

const constants = require('../constants');
const appCodes = require('../app-codes');
const AppError = require('../app-error').AppError;

module.exports = (gatewayReqResLogService) => {

  return {
    async createLog(log) {
      try {
        const ret = await gatewayReqResLogService.create(log);
        return await gatewayReqResLogService.fetch({ id: ret });
      } catch (e) {
        throw e;
      }
    },
    async updateLog(log) {
        let prevLog;
        let newLog = [];
        
        if(log.id) {
            prevLog = await gatewayReqResLogService.fetch({ id: log.id });
        } else {
            prevLog = await gatewayReqResLogService.fetch({ transactionId: log.transactionId });
        }
      
        if (prevLog.length === 0) throw new AppError(appCodes.NOT_FOUND_LOG_DATA);

        if(prevLog.length === 1) {
            newLog.push(Object.assign(prevLog[0], log));
        } else {
            for(let i=0; i< prevLog.length; i++) {
                newLog.push(Object.assign(prevLog[i], log));
            }
        }

        try {
            await gatewayReqResLogService.update(newLog);

            if(log.id) {
                return await gatewayReqResLogService.fetch({ id: log.id });
            } else {
                return await gatewayReqResLogService.fetch({ transactionId: log.transactionId });
            }
            
        } catch (e) {
            throw e;
        }
    },
    async fetchLog(queryParams) {
      try {
        return await gatewayReqResLogService.fetch(queryParams);
      } catch (e) {
        throw e;
      }
    }
  }
};