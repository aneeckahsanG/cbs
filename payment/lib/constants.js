'use strict';

module.exports = {
  ACTIVE: 1,
  TRX_RECORD_OP: {
    VOID: 0,
    CREATE: 1
  },
  TRX_STATUS: {
    INITIATED: 'INITIATED',
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    UNKNOWN: 'UNKNOWN',
    CANCELLED: 'CANCELLED'
  },
  EVENT_TYPE: {
    SYNC_STATUS: 'Sync-Status',
    NOTIFY: 'Notify'
  },
  EVENT_STATE: {
    CREATED: 'Created',
    PROCESSING: 'Processing',
    DONE: 'Done'
  }
};