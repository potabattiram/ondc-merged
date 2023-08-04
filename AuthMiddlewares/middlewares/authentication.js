const { UnauthenticatedError } = require('../lib/errors/index.js');
const validateToken = require('../lib/firebase/validateToken.js');
const MESSAGES = require('../utils/messages.js');


const authentication =  (options) => (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const idToken = authHeader.split(" ")[1];
        validateToken(idToken).then(decodedToken => {
            if (decodedToken) {
                req.user = { decodedToken: decodedToken, token: idToken };
                next();
            } 
            else {
                next(new UnauthenticatedError(MESSAGES.LOGIN_ERROR_USER_ACCESS_TOKEN_INVALID));
            }
        })
    }
    else {
        next(new UnauthenticatedError(MESSAGES.LOGIN_ERROR_USER_ACCESS_TOKEN_INVALID));
    }
};

module.exports = authentication;