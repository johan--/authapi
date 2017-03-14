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
var DaoFactory = require('../model/dao/dao-factory')
var log4js = require('log4js');
var Logger  = require('log4js').Logger;

var log = log4js.getLogger("oidc_auth");

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
                res.redirect(this.settings.login_url + '&client_id=' + req.session["req_client_id"]);
            }
        },
        verifiedUser: function (req, res, next) {
            //console.log("...Check if USER is verfied.... : ", req.session.isValidated);
            if (req.session["userDetails"] && req.session["userDetails"].isValidated) {
                next();
            } else {
                var q = req.parsedParams ? req.path + '?' + querystring.stringify(req.parsedParams) : req.originalUrl;
                q = "/user/auth" + q;
                res.redirect(this.settings.verify_url + '&client_id=' + req.session["req_client_id"]);
            }
        }
    }
}

var OpenIDConnect = function (options) {
    this.settings = extend(true, {}, defaults, options);
    for (var i in this.settings.policies) {
        this.settings.policies[i] = this.settings.policies[i].bind(this);
    }
}

OpenIDConnect.prototype = new EventEmitter();

OpenIDConnect.prototype.errorHandle = function (res, uri, error, desc) {
    log.debug("ERROR", res, "********", uri, "********", error, "********", desc, "********");
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
    log.debug("---endpointParams--");
    try {
        req.parsedParams = this.parseParams(req, res, spec);
        next();
    } catch (err) {
        this.errorHandle(res, err.uri, err.error, err.msg);
    }
}

OpenIDConnect.prototype.parseParams = function (req, res, spec) {
    var params = {};
    var r = getSessionClientData(req) === undefined || getSessionClientData(req) === null ? req.param('redirect_uri') : getSessionClientData(req).redirect_uri;

    if((req.session["req_client_id"] !== undefined && req.session["req_client_id"] !== null && req.session["req_client_id"] !== '') && 
    (req.session.clientsData === undefined || req.session.clientsData === null || getSessionClientData(req) === null || getSessionClientData(req) === undefined)) {
        req.session.clientsData = req.session.clientsData ? req.session.clientsData : {};
        req.session.clientsData[req.session["req_client_id"]] = req.query;
    }

    for (var i in spec) {
        var x = getSessionClientData(req) === undefined || getSessionClientData(req) === null ? req.param(i) : getSessionClientData(req)[i];
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

function getSessionClientData(req) {
    if(req.session.clientsData === undefined || req.session.clientsData === null) {
        return undefined;
    }
    return req.session.clientsData[req.session["req_client_id"]];
}


/**
 * auth
 *
 * returns a function to be placed as middleware in connect/express routing methods. For example:
 *
 * app.get('/authorization', oidc.auth());
 *
 * This is the authorization endpoint, as described in http://tools.ietf.org/html/rfc6749#section-3.1
 *
 */
OpenIDConnect.prototype.auth = function () {
    //log.debug("I AM  Called..");
    var self = this;
    var spec = {
        response_type: true,
        client_id: true,
        scope: true,
        redirect_uri: true,
        state: false,
        nonce: function (params) {
            return params.response_type.indexOf('id_token') !== -1;
        },
        display: false,
        prompt: false,
        max_age: false,
        ui_locales: false,
        claims_locales: false,
        id_token_hint: false,
        login_hint: false,
        acr_values: false,
        response_mode: false
    };
    //log.debug("-----before return----");
    return [function (req, res, next) {
        //log.debug("-----endpointParams----");
        self.endpointParams(spec, req, res, next);
    },
        self.settings.policies.loggedIn,
        self.settings.policies.verifiedUser,
        //self.use(['client', 'consent', 'auth', 'access']),
        function (req, res, next) {
            //log.debug("I AM  HIT waiting for q");
            Q(req.parsedParams).then(function (params) {
                //Step 2: Check if response_type is supported and client_id is valid.
                //log.debug("Check if response_type is supported", params);
                var deferred = Q.defer();
                DaoFactory.getClientDao().getClientByClientId(req.session["req_client_id"], function (err, model) {
                    log.debug("found client here====>", model);
                    if (err || !model || model === '') {
                        deferred.reject({ type: 'error', uri: params.redirect_uri, error: 'invalid_client', msg: 'Client ' + params.client_id + ' doesn\'t exist.' });
                    } else {
                        req.session.clients = req.session.clients ? req.session.clients : {};
                        req.session.clients[model.clientId] = model;
                        deferred.resolve(params);
                    }
                });
                
                switch (getSessionClientData(req).response_type) {
                    case 'none':
                    case 'code':
                    case 'token':
                    case 'id_token':
                        break;
                    default:
                        //var error = false;
                        var sp = getSessionClientData(req).response_type.split(' ');
                        sp.forEach(function (response_type) {
                            if (['code', 'token', 'id_token'].indexOf(response_type) == -1) {
                                throw { type: 'error', uri: req.session.clients[req.session["req_client_id"]].redirect_uris[0], error: 'unsupported_response_type', msg: 'Response type ' + response_type + ' not supported.' };
                            }
                        });
                }
                //log.debug("params--------------------",params);

                return deferred.promise;
            }).then(function (params) {
                //Step 3: Check if scopes are valid, and if consent was given.
                //log.debug(" Check if scopes are valid");
                var deferred = Q.defer();
                var reqsco = getSessionClientData(req).scope.split(' ');
                req.session.scopes = {};
                var promises = [];
                DaoFactory.getConsentDao().findConsent({ user: req.session.user, client: req.session.clients[req.session["req_client_id"]]._id }, function (err, consent) {
                    //log.debug("found consent here====>", consent, err);
                    reqsco.forEach(function (scope) {
                        var innerDef = Q.defer();
                        //log.debug("Checking valid scopes");
                        if (!self.settings.scopes[scope]) {
                            // log.debug("Found invalid scope : ", scope);
                            innerDef.reject({ type: 'error', uri: req.session.clients[req.session["req_client_id"]].redirect_uris[0], error: 'invalid_scope', msg: 'Scope ' + scope + ' not supported.' });
                        }
                        if (!consent) {
                            // log.debug("There is no consent so here i am : innerDef.resolve(true);1");
                            req.session.scopes[scope] = { ismember: false, explain: self.settings.scopes[scope] };
                            innerDef.resolve(true);
                        } else {
                            //log.debug("There is no consent so here i am : innerDef.resolve(true);2");
                            var inScope = consent.scopes.indexOf(scope) !== -1;
                            req.session.scopes[scope] = { ismember: inScope, explain: self.settings.scopes[scope] };
                            innerDef.resolve(!inScope);
                        }
                        //log.debug("TPUSHING ALLL PROMISES HERE1");
                        promises.push(innerDef.promise);
                    });

                    Q.allSettled(promises).then(function (results) {
                        //log.debug("TAFTERPUSHING ALLL PROMISES HERE2", results);
                        var redirect = false;
                        for (var i = 0; i < results.length; i++) {
                            if (results[i].value) {
                                redirect = true;
                                break;
                            }
                        }
                        if (redirect) {
                            //log.debug("TAFTERPUSHING ALLL PROMISES HERE3", results);
                            req.session.client_key = getSessionClientData(req).client_id;
                            var q = req.path + '?' + querystring.stringify(params);
                            deferred.reject({ 
                                type: 'redirect', 
                                uri: self.settings.consent_url + '?' + 
                                    querystring.stringify({ 
                                        return_url: q,
                                        scopes : JSON.stringify(req.session["scopes"]),
                                        client_name : req.session["client_name"]
                                    }) 
                            });
                        } else {
                            deferred.resolve(params);
                        }
                    });
                });

                return deferred.promise;
            }).then(function (params) {
                //Step 5: create responses
                if (getSessionClientData(req).response_type == 'none') {
                    return { params: params, resp: {} };
                } else {
                    var deferred = Q.defer();
                    var promises = [];

                    var rts = getSessionClientData(req).response_type.split(' ');

                    rts.forEach(function (rt) {
                        var def = Q.defer();
                        promises.push(def.promise);
                        switch (rt) {
                            case 'code':
                                var createToken = function () {
                                    var token = cryptoUtil.createHash('md5').update(getSessionClientData(req).client_id).update(Math.random() + '').digest('hex');
                                    DaoFactory.getAuthDao().getAuthBasedOnCode({ code: token }, function (err, auth) {
                                        if (!auth) {
                                            setToken(token);
                                        } else {
                                            createToken();
                                        }
                                    });
                                };

                                var setToken = function (token) {
                                    DaoFactory.getAuthDao().createAuthCode({
                                        client: req.session.clients[req.session["req_client_id"]]._id,
                                        scope: getSessionClientData(req).scope.split(' '),
                                        user: req.session.user,
                                        sub: req.session.sub || req.session.user,
                                        code: token,
                                        redirectUri: req.session.clients[req.session["req_client_id"]].redirect_uris[0],
                                        responseType: getSessionClientData(req).response_type,
                                        status: 'created'
                                    }, function (err, auth) {
                                        log.debug("Authentication code is created", err, auth);
                                        if (!err && auth) {
                                            setTimeout(function () {
                                                DaoFactory.getAuthDao().getAuthBasedOnCode({ code: token }, function (err, auth) {
                                                    if (auth && auth.status == 'created') {
                                                        auth.remove();
                                                    }
                                                });
                                            }, 1000 * 60 * 20); //10 minutes
                                            def.resolve({ code: token });
                                        } else {
                                            def.reject(err || 'Could not create auth');
                                        }
                                    });

                                };

                                createToken();
                                break;
                            case 'id_token':
                                var d = Math.round(new Date().getTime() / 1000);
                                //var id_token = {
                                def.resolve({
                                    id_token: {
                                        iss: self.settings.iss || req.protocol + '://' + req.headers.host,
                                        sub: req.session.sub || req.session.user,
                                        aud: getSessionClientData(req).client_id,
                                        exp: d + 3600,
                                        iat: d,
                                        nonce: params.nonce
                                    }
                                });
                                //def.resolve({id_token: jwt.encode(id_token, req.session.client_secret)});
                                break;
                            case 'token':
                                var createToken = function () {
                                    var token = cryptoUtil.createHash('md5').update(getSessionClientData(req).client_id).update(Math.random() + '').digest('hex');
                                    DaoFactory.getAccessDao().getToken({ token: token }, function (err, access) {
                                        if (!access) {
                                            setToken(token);
                                        } else {
                                            createToken();
                                        }
                                    });
                                };
                                var setToken = function (token) {
                                    var obj = {
                                        token: token,
                                        type: 'Bearer',
                                        expiresIn: 3600,
                                        user: req.session.user,
                                        client: req.session.clients[req.session["req_client_id"]]._id,
                                        scope: getSessionClientData(req).scope.split(' ')
                                    };
                                    DaoFactory.getAccessDao().insertToAccess(obj, function (err, access) {
                                        if (!err && access) {
                                            setTimeout(function () {
                                                access.destroy();
                                            }, 1000 * 3600); //1 hour

                                            def.resolve({
                                                access_token: obj.token,
                                                token_type: obj.type,
                                                expires_in: obj.expiresIn
                                            });
                                        }
                                    });
                                };
                                createToken();
                                break;
                        }
                    });

                    Q.allSettled(promises).then(function (results) {
                        var resp = {};
                        for (var i in results) {
                            resp = extend(resp, results[i].value || {});
                        }
                        if (resp.access_token && resp.id_token) {
                            var hbuf = cryptoUtil.createHmac('sha256', req.session.clients[req.session["req_client_id"]].clientSecret).update(resp.access_token).digest();
                            resp.id_token.at_hash = base64url(hbuf.toString('ascii', 0, hbuf.length / 2));
                            resp.id_token = jwt.encode(resp.id_token, req.session.clients[req.session["req_client_id"]].clientSecret);
                        }
                        deferred.resolve({ params: params, type: getSessionClientData(req).response_type != 'code' ? 'f' : 'q', resp: resp });
                    });

                    return deferred.promise;
                }
            })
                .then(function (obj) {
                    var params = obj.params;
                    var resp = obj.resp;
                    var uri = url.parse(req.session.clients[req.session["req_client_id"]].redirect_uris[0], true);
                    if (getSessionClientData(req).state) {
                        resp.state = getSessionClientData(req).state;
                    }
                    if (req.session.clients[req.session["req_client_id"]].redirect_uris[0]) {
                        /*if (obj.type == 'f') {
                            uri.hash = querystring.stringify(resp);
                        } else {
                            uri.query = resp;
                        }*/
                        //log.debug("----------Reolved----------", uri);
                        //res.redirect(url.format(uri));
                        req.session.clientsData[req.session["req_client_id"]] = null;
                        log.debug('*****************************', req.session.clients[req.session["req_client_id"]].redirect_uris[0] , '?' , querystring.stringify(resp));
                        res.redirect(req.session.clients[req.session["req_client_id"]].redirect_uris[0] + '?' + querystring.stringify(resp));
                    }
                })
                .fail(function (error) {
                    req.session.clientsData[req.session["req_client_id"]] = null;
                    if (error.type == 'error') {
                        self.errorHandle(res, error.uri, error.error, error.msg);
                    } else {
                        log.debug('ERROR********************************', error.uri, error);
                        res.redirect(error.uri);
                    }
                });
        }
    ];
};

/**
 * consent
 *
 * returns a function to be placed as middleware in connect/express routing methods. For example:
 *
 * app.post('/consent', oidc.consent());
 *
 * This method saves the consent of the resource owner to a client request, or returns an access_denied error.
 *
 */
OpenIDConnect.prototype.consent = function () {
    var self = this;
    return [//self.use('consent'),
        function (req, res, next) {
            var accept = req.param('accept');
            var return_url = "/user/auth" + req.param('return_url');
            log.debug("req.param('return_url')", req.param('return_url'));
            //var client_id = req.query.client_id || req.body.client_id || false;
            if (accept) {
                var scopes = [];
                for (var i in req.session.scopes) {
                    scopes.push(i);
                }
                DaoFactory.getConsentDao().removeConsent({ user: req.session.user, client: req.session.clients[req.session["req_client_id"]]._id }, function (err, result) {
                    DaoFactory.getConsentDao().createConsent({ user: req.session.user, client: req.session.clients[req.session["req_client_id"]]._id, scopes: scopes }, function (err, consent) {
                        log.debug('*****************************', ApplicationConfig.REDIRECT_CONFIG.this_api_base_url , return_url , '&client_id=' , req.session["req_client_id"]);
                        res.redirect(ApplicationConfig.REDIRECT_CONFIG.this_api_base_url + return_url);
                    });
                });
            } else {
                var returl = url.parse(return_url, true);
                var redirect_uri = returl.query.redirect_uri;
                self.errorHandle(res, redirect_uri, 'access_denied', 'Resource Owner denied Access.');
            }
        }];
};

/**
 * Render Consent
 *
 * Checks if the callback url is from configured whitelisted domains
 *
 * If yes just skips the consent part and creates a default consent.
 *
 * Further All permissions will be added to the consent part
 */

OpenIDConnect.prototype.renderConsent = function() {
    var self = this;

    return [
        function(req, res, next) {
           
            var return_url = "/user/auth" + req.param('return_url');

            var whitelistedDomain = ApplicationConfig.WHITELISTED_DOMAIN;
            var isWhiteListed = false;
           
            for (var entry of whitelistedDomain) {
               
                if(return_url.indexOf(entry) !== -1){ 
                    isWhiteListed = true;
                } 
            }
            if(isWhiteListed) {
                var scopes = [];
                for (var i in req.session.scopes) {
                    scopes.push(i);
                }
               
                DaoFactory.getConsentDao().removeConsent({ user: req.session.user, client: req.session.clients[req.session["req_client_id"]]._id }, function (err, result) {
                    DaoFactory.getConsentDao().createConsent({ user: req.session.user, client: req.session.clients[req.session["req_client_id"]]._id, scopes: scopes }, function (err, consent) {
                        log.debug("Redirecting to ", ApplicationConfig.REDIRECT_CONFIG.this_api_base_url + return_url);
                        res.redirect(ApplicationConfig.REDIRECT_CONFIG.this_api_base_url + return_url);
                    });
                });
            }else {
              
                var queryParam = querystring.stringify({ 
                                        return_url: req.param('return_url'),
                                        scopes : JSON.stringify(req.session["scopes"]),
                                        client_name : req.session["client_name"]
                                    }) ;

                var url = ApplicationConfig.REDIRECT_CONFIG.identity_ui_consent_url+"?"+queryParam;
               
                res.redirect(url);
            }
        }
    ];
}


exports.oidc = function (options) {
    return new OpenIDConnect(options);
};

exports.defaults = function () {
    return defaults;
};