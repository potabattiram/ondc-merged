const { UnauthenticatedError } = require('../lib/errors/index.js');
const MESSAGES = require('../utils/messages.js');


const juspayAuthentication =  (options) => (req, res, next) => {

    // check for basic auth header
    if (!req?.headers?.authorization || req?.headers?.authorization.indexOf('Basic ') === -1) {
        next(new UnauthenticatedError(MESSAGES.LOGIN_ERROR_USER_ACCESS_TOKEN_INVALID));
    }

    // verify auth credentials
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');

    const [username, password] = credentials.split(':');

    if(username === process.env.JUSPAY_WEBHOOK_USERNAME && password === process.env.JUSPAY_WEBHOOK_PASSWORD) 
    {
        next();
    }
    else 
    {
        next(new UnauthenticatedError(MESSAGES.LOGIN_ERROR_USER_ACCESS_TOKEN_INVALID));
    }

};

module.exports = juspayAuthentication;