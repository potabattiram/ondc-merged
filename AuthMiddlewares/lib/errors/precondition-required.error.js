const ERRORS = require('./errors.js');


class PreconditionRequiredError extends Error {
    constructor(message = ERRORS.PRECONDITION_REQUIRED_ERROR.message, params) {
        super(message);
        this.name = ERRORS.PRECONDITION_REQUIRED_ERROR.name;
        this.status = ERRORS.PRECONDITION_REQUIRED_ERROR.status;
    }
}

module.exports = PreconditionRequiredError;