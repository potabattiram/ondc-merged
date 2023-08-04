const ERRORS = require('./errors.js');


class ConflictError extends Error {
    constructor(message = ERRORS.CONFLICT_ERROR.message, params) {
        super(message);
        this.name = ERRORS.CONFLICT_ERROR.name;
        this.status = ERRORS.CONFLICT_ERROR.status;
    }
}

module.exports = ConflictError;