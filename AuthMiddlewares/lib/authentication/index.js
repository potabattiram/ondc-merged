// import JsonWebToken from "./json-web-token";
// import Token from "./token";
// import passportEmailLocalStrategy from './strategies/passport-email-local';
// import passportUsernameLocalStrategy from './strategies/passport-username-local';
// import passportPhoneLocalStrategy from './strategies/passport-phone-local';
const passportJwtStrategy = require('./strategies/passport-jwt.js');

// exports.JsonWebToken = JsonWebToken;
// exports.Token = Token;
// exports.passportEmailLocalStrategy = passportEmailLocalStrategy;
// exports.passportUsernameLocalStrategy = passportUsernameLocalStrategy;
// exports.passportPhoneLocalStrategy = passportPhoneLocalStrategy;

module.exports = { passportJwtStrategy };