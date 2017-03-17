'use strict'
import * as Q from "q";
import { Request } from "express";
import { IOIDCService, AuthRequestWorkFlow } from "../interface/oidc";
import { DaoFactory } from "../../../model/dao/factory";
import { IDaoFactory } from "../../../model/dao/iDaoFactory";
import { IConsentDao } from "../../../model/dao/interface/consent-dao";
import { IAuthDao } from "../../../model/dao/interface/auth-dao";
import { IRefreshDao } from "../../../model/dao/interface/refresh-dao";
import { User } from "../../../model/entity/user";
import { Client } from "../../../model/entity/client";
import { RefreshToken } from "../../../model/entity/refresh-token";
import { Access } from "../../../model/entity/access";
import { AuthorizationCode } from "../../../model/entity/authcode";
import { AuthorizeRequestData } from "../../../model/entity/authorize-request-data";
import { Consent } from "../../../model/entity/consent";
import { Logger } from '../../../util/logger';
import { Helper } from '../../../util/helper';
import { SessionManager, SessionKeys } from '../../../util/session';
import { ITokenManager } from '../../../token/interface/tokenmanager';
import { TokenFactory, TokenManagerName } from '../../../token/factory';
import { IUserService } from '../../user/interface/user';
import { IAccessService } from '../../access/interface/access';
import { IPassportService } from '../../passport/interface/passport';
import { IClientService } from '../../client/interface/client';
import * as cryptoUtil from 'crypto';

var uuid = require('node-uuid');
var ApplicationConfig = require("../../../config/application-config");

const log = new Logger('OIDCService');
const tokenManager: ITokenManager = TokenFactory.getTokenManager(TokenManagerName.JWT);

export class OIDCService implements IOIDCService {

    authDao: IAuthDao;
    consentDao: IConsentDao;
    refreshDao: IRefreshDao;

    constructor(public clientService: IClientService, public userService: IUserService, public accessService: IAccessService, public passportService: IPassportService, daoFactory: IDaoFactory) {
        log.debug("Intialized OIDC Service : ");
        this.consentDao = daoFactory.getConsentDao();
        this.authDao = daoFactory.getAuthDao();
        this.refreshDao = daoFactory.getRefreshDao();
    }

    /**
     *
     *
     * @param {AuthorizeRequestData} authorizeRequest
     * @returns {Q.Promise<AuthorizeRequestData>}
     *
     * @memberOf OIDCService
     */
    processAuthorizeRequest(authorizeRequest: AuthorizeRequestData): Q.Promise<AuthorizeRequestData> {
        log.debug("processAuthorizeRequest");
        let deferred: Q.Deferred<AuthorizeRequestData> = Q.defer<AuthorizeRequestData>();

        this.checkIfClientExists(authorizeRequest)
            .then(
            /**
             * Check If The User Was In Session.
             * If Not
             *  # Set The workFlowData.skipNextSteps = true, so all consequent steps get skipped and we finally do a redirect.
             *  # Redirect To Login Page On The Identity Front
             * */
            (workFlowData: AuthRequestWorkFlow): Q.Promise<AuthRequestWorkFlow> => {
                return this.checkIfUserInSession(workFlowData);
            })
            .then(
            /**
             * If the Authorize Request Data Already Has Consent Skip This Step And Move To Next.
             *
             * Check Whether A Consent Object Exists For This Application And This User
             * */
            (workFlowData: AuthRequestWorkFlow): Q.Promise<AuthRequestWorkFlow> => {
                return this.checkIfUserConsent(workFlowData);
            })
            .then(
            /**
             *
             * Check If The Authorization Request Is For A Whitelisted Domain
            */
            (workFlowData: AuthRequestWorkFlow): Q.Promise<AuthRequestWorkFlow> => {
                return this.checkIfResponseToWhiteListedDomain(workFlowData);
            })
            .then(
            /**
             * If the user is from whitelisted Domain.
             *  # Create Consent and Accept It.
             *  # Populate The Consent In The Authorize Request.
             *  And Push To The Generate Code Handler.
             * If The user is not from a whitelisted Domain and The consent is not present for the user send the user to the consent page.
             */
            (workFlowData: AuthRequestWorkFlow): Q.Promise<AuthRequestWorkFlow> => {
                return this.createConsentIfRequired(workFlowData);
            })
            .then(
            /**
             * After The Consent Is Populated And We are done
             *
             * This step generates The Code for redirect and passes a redirect, Only if
             *  # skipNextSteps is not true
             *  # generateCode is true
             */
            (workFlowData: AuthRequestWorkFlow): Q.Promise<AuthRequestWorkFlow> => {
                return this.createAuthCodeForUser(workFlowData);
            })
            .then(
            /**Resolve The Main Promise And Send Back Control To The Controller
             * The Controller Should Use The GOTO url to redirect user to the proper location.
             */
            (workFlowData: AuthRequestWorkFlow): void => {
                log.debug("authorize processing completed");
                deferred.resolve(workFlowData.authorizeRequestData);
            })
            .fail((error: Error) => {
                deferred.reject(error);
            });
        return deferred.promise;
    }

    /**
     *
     *
     * @param {AuthorizeRequestData} authorizeRequest
     * @param {string} accept
     * @returns {Q.Promise<AuthorizeRequestData>}
     *
     * @memberOf OIDCService
     */
    consent(authorizeRequest: AuthorizeRequestData, accept: string): Q.Promise<AuthorizeRequestData> {
        log.debug("consent");
        let deferred: Q.Deferred<AuthorizeRequestData> = Q.defer<AuthorizeRequestData>();
        let client_ID: string = null;
        let user_ID: string = (<any>authorizeRequest.user)._id;
        if (accept) {
            log.debug(JSON.stringify(authorizeRequest));
            this.clientService.getClientByClientId(authorizeRequest.clientId)
                .then((client: Client) => {
                    if (client) {
                        client_ID = client.id;
                        return this.consentDao.removeConsent({ user: user_ID, client: client_ID });
                    } else {
                        log.debug("invalid client : " + authorizeRequest.clientId);
                        authorizeRequest.isWorkFlowCompleted = true;
                        authorizeRequest.goto = authorizeRequest.redirectURI + "?error=access_denied&message=Invalid client.";
                        deferred.resolve(authorizeRequest);
                    }
                })
                .then(() => {
                    log.debug("creating consent for user : " + user_ID + ", client : " + client_ID);
                    return this.consentDao.createConsent({ user: user_ID, client: client_ID, scopes: Object.keys(authorizeRequest.scope) });
                })
                .then((consent: Consent) => {
                    log.debug("consent : success");
                    authorizeRequest.goto = ApplicationConfig.REDIRECT_CONFIG.this_api_base_url + "/user/auth/authorize?client_id=" + authorizeRequest.clientId;
                    deferred.resolve(authorizeRequest);
                })
                .fail((error) => { deferred.reject(error); });
        } else {
            log.debug("no consent from user : " + user_ID + ", client : " + authorizeRequest.clientId);
            authorizeRequest.isWorkFlowCompleted = true;
            authorizeRequest.goto = authorizeRequest.redirectURI + "?error=access_denied&message=Resource Owner denied Access.";
            deferred.resolve(authorizeRequest);
        }
        return deferred.promise;
    }

    /**
     *
     *
     * @param {string} grantType
     * @param {string} code
     * @param {string} clientId
     * @param {string} clientSecret
     * @param {string} redirectURL
     * @returns {Q.Promise<any>}
     *
     * @memberOf OIDCService
     */
    token(grantType: string, code: string, clientId: string, clientSecret: string, redirectURL: string, ipaddress: string): Q.Promise<any> {
        log.debug("token");
        let deferred: Q.Deferred<any> = Q.defer();

        let missingParams: Array<string> = [];
        if (!grantType) { missingParams.push("grant_type"); }
        if (!code) { missingParams.push("code"); }
        if (!clientId) { missingParams.push("client_id"); }
        if (!clientSecret) { missingParams.push("client_secret"); }
        if (!redirectURL) { missingParams.push("redirect_uri"); }

        if (missingParams && missingParams.length > 0) {
            deferred.reject({ missingParams: missingParams });
        } else if (grantType === "authorization_code") {
            deferred.promise = this.tokenForAuthorizationCodeGrant(code, clientId, clientSecret, redirectURL, ipaddress);
        } else if (grantType === "refresh_token") {
            deferred.promise = this.tokenForRefreshTokenGrant(code, clientId, clientSecret, redirectURL, ipaddress);
        } else {
            deferred.reject(new Error("Not a valid grant_type."));
        }
        return deferred.promise;
    }

    /**
     *
     *
     * @private
     * @param {string} authCode
     * @param {string} clientId
     * @param {string} clientSecret
     * @param {string} redirectURL
     * @returns {Q.Promise<any>}
     *
     * @memberOf OIDCService
     */
    private tokenForAuthorizationCodeGrant(authCode: string, clientId: string, clientSecret: string, redirectURL: string, ipaddress: string): Q.Promise<any> {
        log.debug("tokenForAuthorizationCodeGrant");
        let deferred: Q.Deferred<any> = Q.defer();
        let errorPart: string = "?error=invalid_grant&message=Authorization code is invalid."

        this.clientService.getClientByClientIdAndClientSecret(clientId, clientSecret)
            .then((client: Client): Q.Promise<any> => {
                let getAuthBasedOnCodeDeferred: Q.Deferred<any> = Q.defer<any>();
                this.authDao.getAuthBasedOnCode({ code: authCode })
                    .then((auth: AuthorizationCode): void => {
                        getAuthBasedOnCodeDeferred.resolve({
                            client: client,
                            auth: auth
                        });
                    }).catch((err: Error) => {
                        getAuthBasedOnCodeDeferred.reject(err);
                    });
                return getAuthBasedOnCodeDeferred.promise;
            })
            .then((object: any): Q.Promise<any> => {
                let auth: AuthorizationCode = <AuthorizationCode>object.auth;
                let client: Client = <Client>object.client;
                let issueTokensDeferred: Q.Deferred<any> = Q.defer<any>();
                if (!auth) {
                    issueTokensDeferred.reject({ callbackURL: redirectURL + errorPart });
                    return issueTokensDeferred.promise;
                }
                else if (auth.status != 'created') {
                    errorPart = "?error=invalid_grant&message=Authorization code already used.";
                    issueTokensDeferred.reject({ callbackURL: redirectURL + errorPart });
                    log.debug(<any>issueTokensDeferred.promise);
                    log.debug(<any>deferred.promise);
                    return issueTokensDeferred.promise;
                }
                issueTokensDeferred.promise = this.issueTokens(auth, client, redirectURL, ipaddress);
                return issueTokensDeferred.promise;
            })
            .then((result: any): void => {
                deferred.resolve(result);
            })
            .fail((err: Error) => {
                deferred.reject(err);
            });
        return deferred.promise;
    }

    /**
     *
     *
     * @private
     * @param {string} token
     * @param {string} clientId
     * @param {string} clientSecret
     * @param {string} redirectURL
     * @returns {Q.Promise<any>}
     *
     * @memberOf OIDCService
     */
    private tokenForRefreshTokenGrant(token: string, clientId: string, clientSecret: string, redirectURL: string, ipaddress: string): Q.Promise<any> {
        log.debug("tokenForRefreshTokenGrant");
        let deferred: Q.Deferred<any> = Q.defer();

        this.clientService.getClientByClientIdAndClientSecret(clientId, clientSecret)
            .then((client: Client) => {
                this.refreshDao.getToken({ token: token })
                    .then((refreshToken: RefreshToken) => {
                        if (!refreshToken) {
                            deferred.reject({ callbackURL: redirectURL + "?error=invalid_grant&message=Refresh token is not valid." });
                        } else {
                            this.authDao.getAuthBasedOnCode({ _id: refreshToken.auth })
                                .then((auth: AuthorizationCode) => {
                                    if (refreshToken.status != 'created') {
                                        deferred.reject({ callbackURL: redirectURL + "?error=invalid_grant&message=Refresh token already used." });
                                    } else {
                                        log.debug("tokenForRefreshTokenGrant :  issuing token");
                                        this.issueTokens(auth, client, redirectURL, ipaddress)
                                            .then((result: any) => { deferred.resolve(result); })
                                            .fail((error) => { deferred.reject(error); });
                                    }
                                })
                                .fail((error) => { deferred.reject(error); });
                        }
                    })
                    .fail((error) => { deferred.reject(error); });
            })

        return deferred.promise;
    }

    /**
     *
     *
     * @private
     * @param {AuthorizationCode} auth
     * @param {Client} client
     * @param {string} redirectURL
     * @returns
     *
     * @memberOf OIDCService
     */
    private issueTokens(auth: AuthorizationCode, client: Client, redirectURL: string, ipaddress: string) {
        log.debug("issueTokens");
        let deferred: Q.Deferred<any> = Q.defer();
        if ((<any>auth.client)._id.toString() === client.id.toString()) {
            let accessToken = cryptoUtil.createHash('md5').update(uuid.v4()).update(Math.random() + '').digest('hex');
            let refreshToken = cryptoUtil.createHash('md5').update(uuid.v4()).update(Math.random() + '').digest('hex');

            log.debug("issueTokens : Creating tokens");
            this.refreshDao.createRefreshToken({ token: refreshToken, scope: auth.scope, status: 'created', auth: (<any>auth)._id })
            .then((refreshTok: RefreshToken) => {
                return this.userService.getUserById(auth.user);
            })
            .then((user: User) => {
                this.passportService.loginByIpCustomStrategy.getOrganizationDetails(ipaddress)
                    .then((result: any) => {
                        let jsonResponse = JSON.parse(result.body.toString());
                        return this.getIdTokenDetails(accessToken, user, auth, client, jsonResponse);
                    })
                    .then((access: Access) => {
                        deferred.resolve({
                            access_token: access.token,
                            token_type: access.type,
                            expires_in: access.expiresIn,
                            refresh_token: refreshToken,
                            id_token: access.idToken
                        });
                    })
                    .fail((error) => { deferred.reject(error); });
            })
            .fail((error) => { deferred.reject(error); });
        } else {
            deferred.reject({ callbackURL: redirectURL + "?error=invalid_grant&message=The code was not issued for this client." });
        }

        return deferred.promise;
    }

    /**
     *
     *@param private
     * @param {string} accessToken
     * @param {User} user
     * @param {AuthorizationCode} auth
     * @param {Client} client
     * @returns {Q.Promise<Access>}
     *
     * @memberOf OIDCService
     */
    private getIdTokenDetails(accessToken: string, user: User, auth: AuthorizationCode, client: Client, orgDetails: any): Q.Promise<Access> {
        log.debug("getIdTokenDetails");
        let deferred: Q.Deferred<Access> = Q.defer<Access>();
        let idToken = {};
        let accessObject: Access = new Access();
        let currentDate = Math.round(new Date().getTime() / 1000);
        if (user) {
            var userJSON = JSON.parse(JSON.stringify(user));
            delete userJSON.credential;
            delete userJSON.consents;
            delete userJSON.clients;
            delete userJSON.accessToken;
            delete userJSON.registrationVerificationToken;
            delete userJSON.registrationVerificationTokenExpiry;

            if (orgDetails && orgDetails.data && orgDetails.data.party_id) {
                userJSON.organizationId = orgDetails.data.party_id;
                if(orgDetails.data.party_name) { userJSON.organizationName = orgDetails.data.party_name; }
            }

            idToken = {
                iss: ApplicationConfig.REDIRECT_CONFIG.identity_ui_base_url,
                sub: auth.sub || auth.user || null,
                aud: client.clientId,
                exp: currentDate + 3600,
                iat: currentDate,
                user: userJSON
            };
        } else {
            idToken = {
                iss: ApplicationConfig.REDIRECT_CONFIG.identity_ui_base_url,
                sub: auth.sub || auth.user || null,
                aud: client.clientId,
                exp: currentDate + 3600,
                iat: currentDate,
            };
        }
        tokenManager.createJwtToken(idToken, client.clientSecret)
            .then((jwtToken: string) => {
                accessObject.token = accessToken;
                accessObject.type = 'Bearer';
                accessObject.expiresIn = 3600;
                accessObject.expiresOn = Helper.getNewExpirationTime();
                accessObject.user = user.id,
                accessObject.client = client.id,
                accessObject.idToken = jwtToken;
                accessObject.scope = auth.scope;
                accessObject.auth = (<any>auth)._id;

                return this.accessService.insertAccessToken(accessObject);
            })
            .then((access: Access) => {
                log.debug("access created : id : " + (<any>access)._id);
                deferred.resolve(access);
            })
            .fail((error) => { deferred.reject(error); });

        return deferred.promise;
    }

    /**
     *
     *
     * @private
     * @param {AuthorizeRequestData} authorizeRequest
     * @returns {Q.Promise<AuthRequestWorkFlow>}
     *
     * @memberOf OIDCService
     */
    private checkIfClientExists(authorizeRequest: AuthorizeRequestData): Q.Promise<AuthRequestWorkFlow> {
        let deferred: Q.Deferred<AuthRequestWorkFlow> = Q.defer<AuthRequestWorkFlow>();
        let workFlowData: AuthRequestWorkFlow = new AuthRequestWorkFlow(authorizeRequest);

        this.clientService.getClientByClientId(authorizeRequest.clientId)
            .then(
            /** Checks Whether A Client Exists With This Client Id */
            (client: Client): void => {
                if (null === client) {
                    workFlowData.isErrorState = true;
                    workFlowData.httpErrorCode = 403;
                    workFlowData.errorParams = {
                        error: "invalid_client",
                        message: "Client " + authorizeRequest.clientId + " doesn\'t exist."
                    }
                    deferred.reject(workFlowData);
                } else {
                    workFlowData.isErrorState = false;
                    workFlowData.client = client;
                    workFlowData.skipNextSteps = false;
                    deferred.resolve(workFlowData);
                }
            })
            .fail((err: Error) => {
                workFlowData.isErrorState = true;
                workFlowData.httpErrorCode = 403;
                workFlowData.errorParams = {
                    error: "error",
                    message: "Issue whild finding the client."
                }
                deferred.reject(workFlowData);
            }).done();

        return deferred.promise;
    }

    /**
     *
     *
     * @private
     * @param {AuthRequestWorkFlow} workFlowData
     * @returns {Q.Promise<AuthRequestWorkFlow>}
     *
     * @memberOf OIDCService
     */
    private checkIfUserInSession(workFlowData: AuthRequestWorkFlow): Q.Promise<AuthRequestWorkFlow> {
        log.debug("checkIfUserInSession");
        let deferred: Q.Deferred<AuthRequestWorkFlow> = Q.defer<AuthRequestWorkFlow>();
        if (!workFlowData.authorizeRequestData.isUserLoggedIn) {
            workFlowData.skipNextSteps = true;
            workFlowData.authorizeRequestData.goto = ApplicationConfig.REDIRECT_CONFIG.login_url + "&client_id=" + workFlowData.authorizeRequestData.clientId;
            deferred.resolve(workFlowData);
        } else {
            deferred.resolve(workFlowData);
        }
        return deferred.promise;
    }

    /**
     *
     *
     * @private
     * @param {AuthRequestWorkFlow} workFlowData
     * @returns {Q.Promise<AuthRequestWorkFlow>}
     *
     * @memberOf OIDCService
     */
    private checkIfUserConsent(workFlowData: AuthRequestWorkFlow): Q.Promise<AuthRequestWorkFlow> {
        log.debug("checkIfUserConsent");
        let deferred: Q.Deferred<AuthRequestWorkFlow> = Q.defer<AuthRequestWorkFlow>();
        if (workFlowData.skipNextSteps) {
            deferred.resolve(workFlowData);
        } else if (workFlowData.authorizeRequestData.consent) {
            deferred.resolve(workFlowData);
        } else {
            /**
             * TODO
             * This Should Be Changed To A Consent Service
             * */
            this.consentDao.findConsent({ user: workFlowData.authorizeRequestData.user.id, client: workFlowData.client.id })
                .then((consent: Consent) => {
                    workFlowData.authorizeRequestData.consent = consent;
                    deferred.resolve(workFlowData);
                })
                .fail((error): void => {
                    deferred.reject(error);
                })
        }

        return deferred.promise;
    }

    /**
     *
     *
     * @private
     * @param {AuthRequestWorkFlow} workFlowData
     * @returns {Q.Promise<AuthRequestWorkFlow>}
     *
     * @memberOf OIDCService
     */
    private checkIfResponseToWhiteListedDomain(workFlowData: AuthRequestWorkFlow): Q.Promise<AuthRequestWorkFlow> {
        log.debug("checkIfResponseToWhiteListedDomain");
        let deferred: Q.Deferred<AuthRequestWorkFlow> = Q.defer<AuthRequestWorkFlow>();
        var whitelistedDomain = ApplicationConfig.WHITELISTED_DOMAIN;
        var isWhiteListed = false;

        if (workFlowData.skipNextSteps) {
            deferred.resolve(workFlowData);
        } else {
            /**
            * If The Domain Is Whitelisted
            */
            for (var entry of whitelistedDomain) {
                if (workFlowData.authorizeRequestData.redirectURI.indexOf(entry) !== -1) {
                    isWhiteListed = true;
                }
            }
            if (isWhiteListed) {
                workFlowData.isWhiteListed = true
            }
            deferred.resolve(workFlowData);
        }
        return deferred.promise;
    }

    /**
     *
     *
     * @private
     * @param {AuthRequestWorkFlow} workFlowData
     * @returns {Q.Promise<AuthRequestWorkFlow>}
     *
     * @memberOf OIDCService
     */
    private createConsentIfRequired(workFlowData: AuthRequestWorkFlow): Q.Promise<AuthRequestWorkFlow> {
        log.debug("createConsentIfRequired");
        let deferred: Q.Deferred<AuthRequestWorkFlow> = Q.defer<AuthRequestWorkFlow>();

        if (workFlowData.skipNextSteps) {
            deferred.resolve(workFlowData);
        } else {
            this.consentDao.findConsent({ user: (<any>workFlowData.authorizeRequestData.user)._id, client: workFlowData.client.id })
                .then((consentOld: Consent) => {
                    if (workFlowData.isWhiteListed || !!consentOld) {
                        let consent: Consent = new Consent();
                        consent.client = workFlowData.client.id;
                        consent.user = (<any>workFlowData.authorizeRequestData.user)._id;
                        consent.scopes = Object.keys(workFlowData.authorizeRequestData.scope);
                        if (!consentOld) {
                            this.consentDao.createConsent(consent)
                                .then((consent: Consent) => {
                                    workFlowData.authorizeRequestData.consent = consent;
                                    workFlowData.skipNextSteps = false;
                                    workFlowData.generateCode = true;
                                    deferred.resolve(workFlowData);
                                })
                                .fail((error): void => {
                                    deferred.reject(error);
                                });
                        } else {
                            workFlowData.authorizeRequestData.consent = consentOld;
                            workFlowData.skipNextSteps = false;
                            workFlowData.generateCode = true;
                            deferred.resolve(workFlowData);
                        }
                    } else {
                        let queryParams: string = "?client_id=" + workFlowData.authorizeRequestData.clientId + "&return_url=" + workFlowData.authorizeRequestData.redirectURI + "&client_name=" + workFlowData.client.name + "&scopes=" + JSON.stringify(Object.values(workFlowData.authorizeRequestData.scope));
                        workFlowData.generateCode = false;
                        workFlowData.skipNextSteps = true;
                        workFlowData.authorizeRequestData.goto = ApplicationConfig.REDIRECT_CONFIG.identity_ui_consent_url + queryParams;
                        deferred.resolve(workFlowData);
                    }
                })
                .fail((error): void => { deferred.reject(error); });
        }
        return deferred.promise;
    }

    /**
     *
     *
     * @private
     * @param {AuthRequestWorkFlow} workFlowData
     * @returns {Q.Promise<AuthRequestWorkFlow>}
     *
     * @memberOf OIDCService
     */
    private createAuthCodeForUser(workFlowData: AuthRequestWorkFlow): Q.Promise<AuthRequestWorkFlow> {
        log.debug("createAuthCodeForUser");
        let deferred: Q.Deferred<AuthRequestWorkFlow> = Q.defer<AuthRequestWorkFlow>();
        if (workFlowData.skipNextSteps) {
            deferred.resolve(workFlowData);
        } else if (workFlowData.generateCode && !workFlowData.skipNextSteps) {

            /**
             * The Code Will Be Generated Based On UUID-v4 and we will replace the Hashes.
             *
             * We are not checking for the code to be present in the Database, as UUID are unique and we should have a clash issue, with the amount of request we serve.
             *
             * I case it does happen we can always update this code.
             */
            let code = cryptoUtil.createHash('md5').update(uuid.v4()).update(Math.random() + '').digest('hex');
            let authorizationCode: AuthorizationCode = new AuthorizationCode();
            authorizationCode.client = workFlowData.client.id;
            authorizationCode.code = code;
            authorizationCode.redirectUri = workFlowData.authorizeRequestData.redirectURI;
            authorizationCode.responseType = workFlowData.authorizeRequestData.responseType;
            authorizationCode.scope = Object.keys(workFlowData.authorizeRequestData.scope);
            authorizationCode.status = "created";
            authorizationCode.user = authorizationCode.sub = (<any>workFlowData.authorizeRequestData.user)._id;
            this.authDao.createAuthCode(authorizationCode)
                .then((auth: AuthorizationCode) => {
                    workFlowData.authorizeRequestData.authorizeCode = auth;
                    workFlowData.skipNextSteps = false;
                    workFlowData.generateCode = false;
                    workFlowData.authorizeRequestData.goto = workFlowData.authorizeRequestData.redirectURI;
                    deferred.resolve(workFlowData)
                })
                .fail((error) => {
                    deferred.reject(error);
                });
        }
        return deferred.promise;
    }
}
