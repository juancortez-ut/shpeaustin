`
    authorization.js

    The following functions checks that the user is authorized to perform actions on the SHPE Website, 
    including logging in, and updating data.

    webAuth is a custom made authorization function that is used to Login. Headers must be present if
    sending a form.
`

const credentialsBuilder = require('./credentialsBuilder.js'),
    websiteLogin = credentialsBuilder.init().websiteLogin,
    database = require('./database.js');

const authorization = (function(){
    // uses basicAuth with custom alert UI to log in
    const auth = function (req, res, next) {
        const basicAuth = require('basic-auth');
        let user = basicAuth(req);

        if (!user || !user.name || !user.pass) {
            return _unauthorized(res, true);
        }

        if (user.name === websiteLogin.username && user.pass === websiteLogin.password) {
            return next();
        } else {
            return _unauthorized(res, true);
        }
    };

    const cookieAuth = function (req, res, next) {
        let credentials = req.query.credentials;

        let url = req.originalUrl;
        let method = req.method;
        
        database.getCachedData('id', (err, data) => {
            if(!!err){
                console.log(`Cookie unauthorized for ${method} method at url "${url}"`);
                console.error(err.reason);
                return _unauthorized(res, false);
            }
            if(data.uuid.indexOf(credentials) >= 0){
                console.log(`Cookie authorized for ${method} method at url "${url}"`);
                return next();
            } else{
                console.log(`Cookie unauthorized for ${method} method at url "${url}"`);
                return _unauthorized(res, false);
            }
        });
    };

    // logs in with POST method and doesnt use basic-auth
    const webAuth = function(req, res, next) {
        let user = {};
        try{
            let authorizationToken = (req && req.headers && req.headers.authorization) || null,
                authenticationString = "";

            if(!!authorizationToken){
                authorizationToken = authorizationToken.split(" ")[1]; // strip Basic from authorization
                authenticationString = new Buffer(authorizationToken, 'base64').toString('ascii');
                authenticationString = authenticationString.split(":");
                user.name = authenticationString[0];
                user.pass = authenticationString[1];
            } else{
                return _unauthorized(res, false);
            }
        } catch(e){
            return _unauthorized(res, false); // any exception thrown, means unauthorized
        }

        if (!user || !user.name || !user.pass) {
            return _unauthorized(res, false);
        }

        if (user.name === websiteLogin.username && user.pass === websiteLogin.password) {
            return next();
        } else {
            return _unauthorized(res, false);
        }
    };

    // @param{Boolean} alert    if FALSE, do not show default LOGIN
    function _unauthorized(res, alert) {
        if(!!alert){
            res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        }
        console.error("[authorization.js]: Unauthorized access.");
        return res.sendStatus(401);
    }

    return{
        auth,
        webAuth,
        cookieAuth
    }
})();

module.exports = {
    authorization
}