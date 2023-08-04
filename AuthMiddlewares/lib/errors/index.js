const UnauthenticatedError = require('./unauthenticated.error.js');
const UnauthorisedError = require('./unauthorised.error.js');
const NoRecordFoundError = require('./no-record-found.error.js');
const DuplicateRecordFoundError = require('./duplicate-record-found.error.js');
const BadRequestParameterError = require('./bad-request-parameter.error.js');
const ConflictError = require('./conflict.error.js');
const PreconditionRequiredError = require('./precondition-required.error.js');


module.exports = { 
    UnauthenticatedError, 
    UnauthorisedError, 
    NoRecordFoundError, 
    DuplicateRecordFoundError,
    BadRequestParameterError,
    ConflictError,
    PreconditionRequiredError
};