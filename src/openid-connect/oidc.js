var querystring = require('querystring');
var extend = require('extend');
var EventEmitter = require('events').EventEmitter;
var cryptoUtil = require('crypto');
var url = require('url');
var Q = require('q');
var jwt = require('jwt-simple');
var util = require("util");
var base64url = require('base64url');
var _ = require('lodash');

var ApplicationConfig = require("../config/application-config");
var helper = require("../util/helper");
var DaoFactory = require('../model/dao/dao-factory')

var log4js = require('log4js');
var Logger = require('log4js').Logger;

var log = log4js.getLogger("oidc");

var defaults = {
    login_url: ApplicationConfig.REDIRECT_CONFIG.login_url,
    verify_url: ApplicationConfig.REDIRECT_CONFIG.verify_url,
    consent_url: ApplicationConfig.REDIRECT_CONFIG.consent_url,
    iss: String(null),
    scopes: {
        openid: 'Informs the Authorization Server that the Client is making an OpenID Connect request.',
        profile: 'Access to the End-User\'s default profile Claims.',
        email: 'Access to the email and email_verified Claims.',
        address: 'Access to the address Claim.',
        phone: 'Access to the phone_number and phone_number_verified Claims.',
        offline_access: 'Grants access to the End-User\'s UserInfo Endpoint even when the End-User is not present (not logged in).'
    },
    policies: {
        loggedIn: function (req, res, next) {
            log.debug("...Check if USER is loggedIn.... : ", req.session.user);
            if (req.session.user) {
                next();
            } else {
                var q = req.parsedParams ? req.path + '?' + querystring.stringify(req.parsedParams) : req.originalUrl;
                log.debug("value of q", q);
                q = "/user/auth" + q;
                res.redirect(this.settings.login_url + '?' + querystring.stringify({ return_url: q }));
            }
        },
        verifiedUser: function (req, res, next) {
            log.debug("...Check if USER is verfied.... : ", req.session.isValidated);
            if (req.session.isValidated) {
                next();
            } else {
                var q = req.parsedParams ? req.path + '?' + querystring.stringify(req.parsedParams) : req.originalUrl;
                q = "/user/auth" + q;
                res.redirect(this.settings.verify_url + '?' + querystring.stringify({ return_url: q }));
            }

        }
    }
}

var OpenIDConnect = function (options) {
    this.clientDao = DaoFactory.getClientDao();
    this.acccesDao = DaoFactory.getAccessDao();
    this.consentDao = DaoFactory.getConsentDao();
    this.refreshDao = DaoFactory.getRefreshDao();
    this.authDao = DaoFactory.getAuthDao();
    this.userDao = DaoFactory.getUserDao();
    this.settings = extend(true, {}, defaults, options);
    for (var i in this.settings.policies) {
        this.settings.policies[i] = this.settings.policies[i].bind(this);
    }
}

OpenIDConnect.prototype = new EventEmitter();



OpenIDConnect.prototype.errorHandle = function (res, uri, error, desc) {
    if (uri) {
        var redirect = url.parse(uri, true);
        redirect.query.error = error; //'invalid_request';
        redirect.query.error_description = desc; //'Parameter '+x+' is mandatory.';
        //res.redirect(400, url.format(redirect));
        res.redirect(url.format(redirect));
    } else {
        res.send(400, error + ': ' + desc);
    }
};

OpenIDConnect.prototype.endpointParams = function (spec, req, res, next) {
    try {
        req.parsedParams = this.parseParams(req, res, spec);
        next();
    } catch (err) {
        this.errorHandle(res, err.uri, err.error, err.msg);
    }
}

OpenIDConnect.prototype.parseParams = function (req, res, spec) {
    var params = {};
    var r = req.param('redirect_uri');
    for (var i in spec) {
        var x = req.param(i);
        if (x) {
            params[i] = x;
        }
    }

    for (var i in spec) {
        var x = params[i];
        if (!x) {
            var error = false;
            if (typeof spec[i] == 'boolean') {
                error = spec[i];
            } else if (_.isPlainObject(spec[i])) {
                for (var j in spec[i]) {
                    if (!util.isArray(spec[i][j])) {
                        spec[i][j] = [spec[i][j]];
                    }
                    spec[i][j].forEach(function (e) {
                        if (!error) {
                            if (util.isRegExp(e)) {
                                error = e.test(params[j]);
                            } else {
                                error = e == params[j];
                            }
                        }
                    });
                }
            } else if (_.isFunction(spec[i])) {
                error = spec[i](params);
            }

            if (error) {
                throw { type: 'error', uri: r, error: 'invalid_request', msg: 'Parameter ' + i + ' is mandatory.' };
                //this.errorHandle(res, r, 'invalid_request', 'Parameter '+i+' is mandatory.');
                //return;
            }
        }
    }
    return params;
};


function parse_authorization(authorization) {
    if (!authorization)
        return null;

    var parts = authorization.split(' ');

    if (parts.length != 2 || parts[0] != 'Basic')
        return null;

    var creds = new Buffer(parts[1], 'base64').toString(),
        i = creds.indexOf(':');

    if (i == -1)
        return null;

    var username = creds.slice(0, i);
    var password = creds.slice(i + 1);

    return [username, password];
}


/**
 * token
 *
 * returns a function to be placed as middleware in connect/express routing methods. For example:
 *
 * app.get('/token', oidc.token());
 *
 * This is the token endpoint, as described in http://tools.ietf.org/html/rfc6749#section-3.2
 *
 */
OpenIDConnect.prototype.token = function () {
    var self = this;
    var spec = {
        grant_type: true,
        code: false,
        redirect_uri: false,
        refresh_token: false,
        scope: false
    };

    return [
        function (req, res, next) {
            self.endpointParams(spec, req, res, next)
        },

        //self.use({policies: {loggedIn: false}, models:['client', 'consent', 'auth', 'access', 'refresh']}),

        function (req, res, next) {
            var params = req.parsedParams;
            var client_key = req.body.client_id;
            var client_secret = req.body.client_secret;

            if (!client_key || !client_secret) {
                var authorization = parse_authorization(req.headers.authorization);
                if (authorization) {
                    client_key = authorization[0];
                    client_secret = authorization[1];
                }
            }
            if (!client_key || !client_secret) {
                self.errorHandle(res, params.redirect_uri, 'invalid_client', 'No client credentials found.');
            } else {

                Q.fcall(function () {
                    //Step 2: check if client and clientSecret are valid
                    var deferred = Q.defer();
                    DaoFactory.getClientDao().getClientByClientIdAndSecret(client_key, client_secret, function (err, client) {
                        if (err || !client) {
                            deferred.reject({ type: 'error', error: 'invalid_client', msg: 'Client doesn\'t exist or invalid clientSecret.' });
                        } else {
                            deferred.resolve(client);
                        }
                    });
                    return deferred.promise;
                })
                    .then(function (client) {
                        var deferred = Q.defer();
                        log.debug(" creating token for param grant_type: ", params.grant_type);
                        switch (params.grant_type) {
                            //Client is trying to exchange an authorization code for an access token
                            case "authorization_code":
                                //Step 3: check if code is valid and not used previously
                                DaoFactory.getAuthDao().getAuthBasedOnCode({ code: params.code }, function (err, auth) {
                                    if (!err && auth) {

                                        if (auth.status != 'created') {
                                            DaoFactory.getRefreshDao().removeRefreshToken({ auth: auth._id }, function (err, result) {
                                                log.debug('authorization_code: removeRefreshToken callback', err, result);
                                                if (!err) {
                                                    DaoFactory.getAccessDao().removeAccess({ auth: auth._id }, function (err, result) {
                                                        log.debug("authorization_code: removeAccess callback", err, result);
                                                        if (!err) {
                                                            DaoFactory.getAuthDao().removeAuthCode({ auth: auth._id }, function (err, result) {
                                                                log.debug("authorization_code: removeAuthCode callback", result);

                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                            deferred.reject({ type: 'error', error: 'invalid_grant', msg: 'Authorization code already used.' });
                                        } else {
                                            //obj.auth = a;
                                            log.debug("-------authorization_code done-----------", auth, auth.scope, client, auth.user, auth.sub);
                                            deferred.resolve({ auth: auth, scope: auth.scope, client: client, user: auth.user, sub: auth.sub });
                                        }
                                    } else {
                                        deferred.reject({ type: 'error', error: 'invalid_grant', msg: 'Authorization code is invalid.' });
                                    }
                                });
                                //Extra checks, required if grant_type is 'authorization_code'
                                var obj = deferred.promise.then(function (obj) {
                                    //Step 4: check if grant_type is valid
                                    //log.debug("check if grant_type is valid", obj, params.redirect_uri);
                                    if (obj.auth.responseType != 'code') {
                                        throw { type: 'error', error: 'unauthorized_client', msg: 'Client cannot use this grant type.' };
                                    }

                                    //Step 5: check if redirect_uri is valid
                                    if ((obj.auth.redirectUri || params.redirect_uri) && obj.auth.redirectUri != params.redirect_uri) {
                                        //log.debug("Error occured while redirecting----", error);
                                        throw { type: 'error', error: 'invalid_grant', msg: 'Redirection URI does not match.' };
                                    }
                                    return obj;
                                });
                                return obj;

                            //Client is trying to exchange a refresh token for an access token
                            case "refresh_token":
                                //Step 3: check if refresh token is valid and not used previously
                                DaoFactory.getRefreshDao().getToken({ token: params.refresh_token }, function (err, refresh) {
                                    if (!err && refresh) {
                                        DaoFactory.getAuthDao().getAuthBasedOnCode({ _id: refresh.auth }, function (err, auth) {
                                            log.debug("-----auth-----", auth, "---refresh_status---", refresh.status);
                                            if (refresh.status != 'created') {
                                                DaoFactory.getAccessDao().removeAccess({ auth: auth._id }, function (err, result) {
                                                    log.debug("refresh_token: removeAccess callback", err, result);
                                                    if (!err) {
                                                        DaoFactory.getRefreshDao().removeRefreshToken({ auth: auth._id }, function (err, result) {
                                                            log.debug("refresh_token: removeRefreshToken callback", err, result);
                                                            if (!err) {
                                                                DaoFactory.getAuthDao().removeAuthCode({ _id: auth._id }, function (err, result) {
                                                                    if (!err) {
                                                                        log.debug("refresh_token:removeAuthCode callback", result);
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                                deferred.reject({ type: 'error', error: 'invalid_grant', msg: 'Refresh token already used.' });
                                            } else {
                                                refresh.status = 'used';
                                                refresh.save();
                                                deferred.resolve({ auth: auth, client: client, user: auth.user, sub: auth.sub });
                                            }
                                        });
                                    } else {
                                        deferred.reject({ type: 'error', error: 'invalid_grant', msg: 'Refresh token is not valid.' });
                                    }
                                });
                                return deferred.promise.then(function (obj) {
                                    if (params.scope) {
                                        var scopes = params.scope.split(' ');
                                        if (scopes.length) {
                                            scopes.forEach(function (scope) {
                                                if (obj.auth.scope.indexOf(scope) == -1) {
                                                    throw { type: 'error', uri: params.redirect_uri, error: 'invalid_scope', msg: 'Scope ' + scope + ' was not granted for this token.' };
                                                }
                                            });
                                            obj.scope = scopes;
                                        }
                                    } else {
                                        obj.scope = obj.auth.scope;
                                    }

                                    return obj;
                                });
                            case 'client_credentials':
                                log.debug("client_credentials:", client)
                                if (!client.credentialsFlow) {

                                    deferred.reject({ type: 'error', error: 'unauthorized_client', msg: 'Client cannot use this grant type.' });
                                } else {
                                    deferred.resolve({ scope: params.scope.split(" "), auth: false, client: client });
                                }
                                return deferred.promise;
                        }

                    })
                    .then(function (obj) {
                        //Check if code was issued for client
                        log.debug("--Check if code was issued for client---", obj.auth, client_key);
                        if (params.grant_type != 'client_credentials' && obj.auth.client.clientId != client_key) {
                            throw { type: 'error', error: 'invalid_grant', msg: 'The code was not issued for this client.' };
                        }

                        return obj;

                    })
                    .then(function (prev) {
                        //Create access token
                        var createToken = function (model, cb) {
                            log.debug("createToken :", model);
                            var token = cryptoUtil.createHash('md5').update(Math.random() + '').digest('hex');
                            model.getToken({ token: token }, function (err, response) {
                                log.debug("getToken : response", err, response);
                                if (!response) {
                                    cb(token);
                                } else {

                                    createToken(model, cb);
                                }
                            });
                        };
                        var setToken = function (access, refresh) {
                            DaoFactory.getRefreshDao().createRefreshToken({
                                token: refresh,
                                scope: prev.scope,
                                status: 'created',
                                auth: prev.auth ? prev.auth.id : null
                            },
                                function (err, refresh) {
                                    setTimeout(function () {
                                        //refresh.destroy();
                                        DaoFactory.getRefreshDao().removeRefreshToken({ _id: refresh._id }, function (err, result) {
                                            log.debug("removeRefreshToken callback :", err, result);
                                        });
                                        if (refresh.auth) {
                                            DaoFactory.getAuthDao().getAuthBasedOnCode({ id: refresh.auth }, function (err, auth) {
                                                if (auth && !auth.accessTokens.length && !auth.refreshTokens.length) {
                                                    //auth.destroy();
                                                    DaoFactory.getAuthDao().removeAuthCode({ _id: auth._id }, function (err, result) {
                                                        log.debug("removeAuthCode callback :", err, result);
                                                    });
                                                }
                                            });
                                        }
                                    }, 1000 * 3600 * 5); //5 hours

                                    DaoFactory.getUserDao().getUserByUserId(prev.user, function(error, userDetails) { 
                                        var d = Math.round(new Date().getTime() / 1000);
                                        log.debug('Got user details : ', userDetails);
                                        var id_token = {};

                                        if(userDetails || null !== null) {
                                            var userJSON = JSON.parse(JSON.stringify(userDetails));
                                            delete userJSON.credential;
                                            delete userJSON.consents;
                                            delete userJSON.clients;
                                            delete userJSON.accessToken;
                                            delete userJSON.registrationVerificationToken;
                                            delete userJSON.registrationVerificationTokenExpiry;
                                            id_token = {
                                                iss: self.settings.iss || req.protocol + '://' + req.headers.host,
                                                sub: prev.sub || prev.user || null,
                                                aud: prev.client.clientId,
                                                exp: d + 3600,
                                                iat: d,
                                                user : userJSON
                                            };
                                        } else {
                                            id_token = {
                                                iss: self.settings.iss || req.protocol + '://' + req.headers.host,
                                                sub: prev.sub || prev.user || null,
                                                aud: prev.client.clientId,
                                                exp: d + 3600,
                                                iat: d
                                            };
                                        }
                                        log.debug("OIDC Client Secret Is " + prev.client);
                                        DaoFactory.getAccessDao().insertToAccess({
                                            token: access,
                                            type: 'Bearer',
                                            expiresIn: 3600,
                                            expiresOn: helper.getNewExpirationTime(),
                                            user: prev.user || null,
                                            client: prev.client.id,                                            
                                            idToken: jwt.encode(id_token, prev.client.clientSecret),
                                            scope: prev.scope,
                                            auth: prev.auth ? prev.auth.id : null
                                        },
                                            function (err, access) {
                                                if (!err && access) {
                                                    if (prev.auth) {
                                                        prev.auth.status = 'used';
                                                        prev.auth.save();
                                                    }

                                                    setTimeout(function () {
                                                        //access.destroy();
                                                        DaoFactory.getAccessDao().removeAccess({ _id: access._id }, function (err, result) {
                                                            log.debug("removeAccess callback :", err, result);
                                                        });

                                                        if (access.auth) {
                                                            DaoFactory.getAuthDao().getAuthBasedOnCode({ id: access.auth }, function (err, auth) {
                                                                if (auth && !auth.accessTokens.length && !auth.refreshTokens.length) {
                                                                    //auth.destroy();
                                                                    DaoFactory.getAuthDao().removeAuthCode({ _id: auth._id }, function (err, result) {
                                                                        log.debug("removeAuthCode callback :", err, result);
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    }, 1000 * 3600); //1 hour

                                                    res.json({
                                                        access_token: access.token,
                                                        token_type: access.type,
                                                        expires_in: access.expiresIn,
                                                        refresh_token: refresh.token,
                                                        id_token: access.idToken
                                                    });
                                                }
                                            });
                                        });
                                });
                        };
                        createToken(DaoFactory.getAccessDao(), function (access) {
                            createToken(DaoFactory.getRefreshDao(), function (refresh) {
                                setToken(access, refresh);
                            });
                        });
                    })
                    .fail(function (error) {
                        if (error.type == 'error') {
                            self.errorHandle(res, params.redirect_uri, error.error, error.msg);
                        } else {
                            res.redirect(error.uri);
                        }
                    });
            }
        }];
};

/**
 * check
 *
 * returns a function to be placed as middleware in connect/express routing methods. For example:
 *
 * app.get('/api/user', oidc.check('openid', /profile|email/), function(req, res, next) { ... });
 *
 * If no arguments are given, checks if access token is valid.
 *
 * The other arguments may be of type string or regexp.
 *
 * This function is used to check if user logged in, if an access_token is present, and if certain scopes where granted to it.
 */
OpenIDConnect.prototype.check = function () {
    //Seguir desde acá!!!!
    var scopes = Array.prototype.slice.call(arguments, 0);
    if (!util.isArray(scopes)) {
        scopes = [scopes];
    }
    var self = this;
    var spec = {
        access_token: false
    };

    return [
        function (req, res, next) {
            self.endpointParams(spec, req, res, next);
        },
        //self.use({policies: {loggedIn: false}, models:['access', 'auth']}),
        function (req, res, next) {
            var params = req.parsedParams;
            if (!scopes.length) {
                next();
            } else {
                if (!params.access_token) {
                    params.access_token = (req.headers['authorization'] || '').indexOf('Bearer ') === 0 ? req.headers['authorization'].replace('Bearer', '').trim() : false;
                }
                if (params.access_token) {
                    // log.debug("access token is : ", params.access_token)
                    DaoFactory.getAccessDao().getToken({ token: params.access_token }, function (err, access) {
                        if (!err && access) {
                            var errors = [];

                            scopes.forEach(function (scope) {
                                if (typeof scope == 'string') {
                                    if (access.scope.indexOf(scope) == -1) {
                                        errors.push(scope);
                                    }
                                } else if (util.isRegExp(scope)) {
                                    var inS = false;
                                    access.scope.forEach(function (s) {
                                        if (scope.test(s)) {
                                            inS = true;
                                        }
                                    });
                                    !inS && errors.push('(' + scope.toString().replace(/\//g, '') + ')');
                                }
                            });
                            if (errors.length > 1) {
                                var last = errors.pop();
                                self.errorHandle(res, null, 'invalid_scope', 'Required scopes ' + errors.join(', ') + ' and ' + last + ' were not granted.');
                            } else if (errors.length > 0) {
                                self.errorHandle(res, null, 'invalid_scope', 'Required scope ' + errors.pop() + ' not granted.');
                            } else {
                                req.check = req.check || {};
                                req.check.scopes = access.scope;
                                next();
                            }
                        } else {
                            self.errorHandle(res, null, 'unauthorized_client', 'Access token is not valid.');
                        }
                    });
                } else {
                    self.errorHandle(res, null, 'unauthorized_client', 'No access token found.');
                }
            }
        }
    ];
};


/**
 * removetokens
 *
 * returns a function to be placed as middleware in connect/express routing methods. For example:
 *
 * app.get('/logout', oidc.removetokens(), function(req, res, next) { ... });
 *
 * this function removes all tokens that were issued to the user
 * access_token is required either as a parameter or as a Bearer token
 */
OpenIDConnect.prototype.removetokens = function () {
    var self = this,
        spec = {
            access_token: false //parameter not mandatory
        };

    return [
        function (req, res, next) {
            self.endpointParams(spec, req, res, next);
        },
        //self.use({policies: {loggedIn: false}, models: ['access','auth']}),
        function (req, res, next) {
            var params = req.parsedParams;
            log.debug("removetokens- params :", params);
            if (!params.access_token) {
                log.debug("request Headers authorization :", req.headers['authorization']);
                params.access_token = (req.headers['authorization'] || '').indexOf('Bearer ') === 0 ? req.headers['authorization'].replace('Bearer', '').trim() : false;

            }
            if (params.access_token) {
                //Delete the provided access token, and other tokens issued to the user
                DaoFactory.getAccessDao().getToken({ token: params.access_token }, function (err, access) {
                    if (!err && access) {
                        DaoFactory.getAuthDao().getAuthBasedOnCode({ user: access.user }, function (err, auth) {
                            if (!err && auth) {
                                DaoFactory.getAccessDao().removeAccess({ auth: auth._id }, function (err, result) {
                                    log.debug("removetokens : removeAccess:", err, result);
                                    if (!err) {
                                        DaoFactory.getRefreshDao().removeRefreshToken({ auth: auth._id }, function (err, result) {
                                            log.debug("removetokens : removeRefreshToken:", err, result);
                                        });
                                    }
                                });
                            }
                            DaoFactory.getAccessDao().findAccess({ user: access.user }, function (err, accesses) {
                                if (!err && accesses) {
                                    accesses.forEach(function (access) {
                                        //access.destroy();
                                        DaoFactory.getAccessDao().removeAccess({ _id: access._id }, function (err, result) {
                                            log.debug("removetokens : removeAccess:", err, result);
                                        });
                                    });

                                };
                                return next();
                            });
                        });
                    } else {
                        self.errorHandle(res, null, 'unauthorized_client', 'Access token is not valid.');
                    }
                });
            } else {
                self.errorHandle(res, null, 'unauthorized_client', 'No access token found.');
            }
        }
    ];
};

exports.oidc = function (options) {
    return new OpenIDConnect(options);
};

exports.defaults = function () {
    return defaults;
};