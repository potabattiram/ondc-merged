const ERRORS = require('./errors.js');

class DuplicateRecordFoundError extends Error {
    constructor(message = ERRORS.DUPLICATE_RECORD_FOUND_ERROR.message, params) {
        super(message);
        this.name = ERRORS.DUPLICATE_RECORD_FOUND_ERROR.name;
        this.status = ERRORS.DUPLICATE_RECORD_FOUND_ERROR.status;
    }
}

module.exports = DuplicateRecordFoundError;