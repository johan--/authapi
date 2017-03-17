'use strict'
import * as Q from "q";
import { Request, Response } from "express";
import { DaoFactory } from "../../model/dao/factory";
import { IDaoFactory } from "../../model/dao/iDaoFactory";
import { IUserDao } from "../../model/dao/interface/user-dao";
import { SocialStrategy } from "./social-strategy";
import { IProfileTransform } from "../../profile-transform/interface/profile-transform";
import { ProfileTransformFactory, ProfileName } from "../../profile-transform/factory";
import { User } from "../../model/entity/user";
import { OrcidUser } from "../../model/entity/orcid-user";
import { Logger } from '../../util/logger';
import { Helper } from '../../util/helper';
import ApplicationConfig = require("../../config/application-config");

var ajaxRequest = require('request');
var querystring = require('querystring');
let CustomStrategy = require("passport-custom").Strategy;

const log = new Logger('orcid-custom-strategy');

export class OrcidCustomStrategy {

    passport: any;
    userDao: IUserDao;
    socialStrategy : SocialStrategy

    constructor(passportInstance: any, daoFactory: IDaoFactory) {
        this.socialStrategy = new SocialStrategy(daoFactory);
        this.passport = passportInstance;
        this.userDao = daoFactory.getUserDao();
        this.createOrcidCustomStrategy();
    }

    /**
     * 
     * 
     * @private
     * 
     * @memberOf OrcidCustomStrategy
     */
    private createOrcidCustomStrategy() {
        log.debug("initializing Orcid Custom Strategy");
        let self = this;
        this.passport.use('orcid-custom', new CustomStrategy(
            function (req: Request, done: any) {
                log.debug("createOrcidCustomStrategy :  orcid-custom with " +  req.query.code);
                if (req.query.code) {
                    //get the access token from the code in the request parameter.
                    let code = req.query.code;
                    self.getOrcidAccessToken(code)
                    .then((result : any) => { return self.onOrcidAcessTokenResponse(result.res, result.body); })
                    .then((user : User) => { done(null, user); })
                    .fail((err : Error) => { done(err, null); })
                    .done();
                } else {
                    //redirect to orcid authorization URL
                }
            }
        ));
    }

    /**
     * 
     * 
     * @private
     * @param {*} authorizationCode
     * @returns {Q.Promise<User>}
     * 
     * @memberOf OrcidCustomStrategy
     */
    private getOrcidAccessToken(authorizationCode: any) : Q.Promise<User> {
        log.debug("getOrcidAccessToken");
        let deferred : Q.Deferred<any> = Q.defer();

        let postData = querystring.stringify({
            grant_type: "authorization_code",
            client_id: ApplicationConfig.ORCID_CONFIG.clientID,
            client_secret: ApplicationConfig.ORCID_CONFIG.clientSecret,
            code: authorizationCode
        });
        let postHeaders = { "Content-Type": "application/x-www-form-urlencoded" };

        log.debug("postData", postData);
        log.debug("postHeaders", postHeaders);
        ajaxRequest.post(
            {
                //url:ApplicationConfig.ORCID_CONFIG.tokenURL,
                //data:postData,
                url: ApplicationConfig.ORCID_CONFIG.tokenURL + "?" + postData,
                headers: postHeaders
            },
            function (err: any, res: Response, body: HTMLBodyElement) {
                log.debug("getOrcidAccessToken : On Access Token Call :", { Error : err, Body :  body });
                if(err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve({ res : res, body : body });
                }
            }
        );
        return deferred.promise;
    }

    /**
     * 
     * 
     * @private
     * @param {Response} res
     * @param {HTMLBodyElement} body
     * @returns {Q.Promise<User>}
     * 
     * @memberOf OrcidCustomStrategy
     */
    private onOrcidAcessTokenResponse(res: Response, body: HTMLBodyElement) : Q.Promise<User> {
        log.debug("onOrcidAcessTokenResponse");
        let deferred : Q.Deferred<any> = Q.defer();

        if (res.statusCode == 200) {
            let jsonResponse = JSON.parse(body.toString());
            let orcidId : any = jsonResponse.orcid;
            let access_token : any = jsonResponse.access_token;
            log.debug("onOrcidAcessTokenResponse : orcid id : " + orcidId)

            this.getOrcidProfile(orcidId, access_token)
            .then((result : any) => { return this.onOrcidProfileResponse(result.res, result.body, access_token) })
            .then((user : User) => { deferred.resolve(user); })
            .fail((err : Error) => { deferred.reject(err); })
            .done();
        } else {
            deferred.reject(new Error("Unable to get access token. Status Code : " + res.statusCode));
        }
        
        return deferred.promise;
    }

    /**
     * 
     * 
     * @private
     * @param {*} orcidId
     * @param {*} accessToken
     * @returns {Q.Promise<any>}
     * 
     * @memberOf OrcidCustomStrategy
     */
    private getOrcidProfile(orcidId: any, accessToken: any) : Q.Promise<any> {
        log.debug("getOrcidProfile");
        let deferred : Q.Deferred<any> = Q.defer();
        let get_headers = {
            'content-type': "application/orcid+json",
            'authorization': "Bearer " + accessToken,
            'cache-control': "no-cache",
            'Accept': 'application/json'
        }

        ajaxRequest({
            url: ApplicationConfig.ORCID_CONFIG.apiUrl + orcidId + "/orcid-profile",
            method: 'GET',
            headers: get_headers,
        }, function (err: any, res: Response, body: HTMLBodyElement) {
            log.debug("On Get profile Call :", { Error : err, Body :  body });
            if(err) {
                deferred.reject(err);
            } else {
                deferred.resolve({ res : res, body : body });
            }
        });
        return deferred.promise;
    }

    /**
     * 
     * 
     * @private
     * @param {Response} res
     * @param {HTMLBodyElement} body
     * @param {*} access_token
     * @returns {Q.Promise<User>}
     * 
     * @memberOf OrcidCustomStrategy
     */
    private onOrcidProfileResponse(res: Response, body: HTMLBodyElement, access_token: any) : Q.Promise<User> {
        log.debug("onOrcidProfileResponse");
        let deferred : Q.Deferred<any> = Q.defer();
        if (res.statusCode == 200) {
            try {
                let orcidProfileResponse = JSON.parse(body.toString());
                let profileTransform : IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.orcid);
                let newUser: OrcidUser = <OrcidUser>profileTransform.createUserFromProfile(orcidProfileResponse); 
                log.debug('newUser: ' + JSON.stringify(newUser));
                newUser.orcidAccessToken = access_token;

                this.userDao.searchUsers({ orcidId : newUser.orcidId })
                .then((existingUsers: Array<User>) => {
                    if (existingUsers && existingUsers.length > 0) {
                        let foundUser: User = existingUsers[0];
                        if (foundUser.email && null != foundUser.email && foundUser.email.length > 0) {
                            log.debug("onOrcidProfileResponse : keeping the original orcid email : ", foundUser.email);
                            newUser.email = foundUser.email;
                            newUser.username = foundUser.email;
                        }
                        return this.socialStrategy.loginSocialUser(foundUser.id, newUser);
                    } else {
                        return this.socialStrategy.registerSocialUser(newUser);
                    }
                })
                .then((userDetails : User) => { deferred.resolve(userDetails); })
                .fail((err : Error) => { deferred.reject(err); })
                .done();
            } catch (error) {
                deferred.reject(error);
            }
        } else {
            deferred.reject(new Error("Unable to Orcid Profile : " + res.statusCode));
        }
        return deferred.promise;
    }
}