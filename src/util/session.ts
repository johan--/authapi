'use strict'

import { Request } from 'express';
import * as Q from 'q';
import {AuthorizeRequestData} from "../model/entity/authorize-request-data";
import { Logger } from '../util/logger';

const log = new Logger('SessionManager');

export enum SessionKeys {  
    User_Details, IsAuthorizationFlow
} 

export class SessionManager {
    /**
     * get session data
     * 
     * @static
     * @param {Request} req
     * @param {string} key
     * @returns {*}
     * 
     * @memberOf SessionManager
     */
    static get(req : Request, key : SessionKeys) : Q.Promise<any> {
        let deferred : Q.Deferred<any> = Q.defer();  
        try {
            let result = req.session[key];
            result = result === undefined ? null : result;
            deferred.resolve(result);
        } catch(error) {
            log.error(error.message, error);
            deferred.reject(error);
        }
        return deferred.promise;
    }

    /**
     * set session data
     * 
     * @static
     * @param {Request} req
     * @param {string} key
     * @param {*} value
     * 
     * @memberOf SessionManager
     */
    static set(req : Request, key : SessionKeys, value : any) : Q.Promise<any> {
        let deferred : Q.Deferred<any> = Q.defer();  
        try {
            req.session[key] = value;
            deferred.resolve(value);
        } catch(error) {
            log.error(error.message, error);
            deferred.reject(error);
        }
        return deferred.promise;
    }

    /**
     * 
     * 
     * @static
     * @param {Request} req
     * @returns {Q.Promise<boolean>}
     * 
     * @memberOf SessionManager
     */
    static isUserInSession(req : Request) : Q.Promise<boolean> {
        let deferred : Q.Deferred<any> = Q.defer();
        try {
            SessionManager.get(req, SessionKeys.User_Details)
            .then((user : any) => {
                if(user && user["_id"]) {
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }
            })
            .fail((err : Error) => { deferred.reject(err); }).done();
        } catch(error) {
            log.error(error.message, error);
            deferred.reject(error);
        }
        return deferred.promise;
    }

    static sessionDestroy(req : Request) : Q.Promise<boolean> {
        let deferred : Q.Deferred<any> = Q.defer();
        try {
            req.session.destroy(function (err : Error) {
                if(err) {
                    deferred.reject(err);
                }
                deferred.resolve(true);
            });
        } catch(error) {
            log.error(error.message, error);
            deferred.reject(error);
        }
        return deferred.promise;
    }

    /**
     * 
     * 
     * @static
     * @param {Request} request
     * @param {AuthorizeRequestData} authorizeRequestData
     * @returns {Q.Promise<AuthorizeRequestData>}
     * 
     * @memberOf SessionManager
     */
    static setAuthorizeRequestData(request : Request, authorizeRequestData : AuthorizeRequestData) : Q.Promise<AuthorizeRequestData> {
        let deferred : Q.Deferred<any> = Q.defer();  
        try {
            if(!request.session["authorizeRequestData"]) {
                request.session["authorizeRequestData"] = {};
            }
            request.session["authorizeRequestData"][authorizeRequestData.clientId] = authorizeRequestData;
            deferred.resolve(authorizeRequestData);
        } catch(error) {
            log.error(error.message, error);
            deferred.reject(error);
        }
        return deferred.promise;
    }

    /**
     * 
     * 
     * @static
     * @param {Request} request
     * @param {string} clientId
     * @returns {Q.Promise<AuthorizeRequestData>}
     * 
     * @memberOf SessionManager
     */
    static getAuthorizeRequestData(request : Request, clientId : string) : Q.Promise<AuthorizeRequestData> {
        let deferred : Q.Deferred<any> = Q.defer();  
        try {
            if(request.session["authorizeRequestData"]) {
                deferred.resolve(<AuthorizeRequestData>(request.session["authorizeRequestData"][clientId]));
            } else {
                deferred.resolve(<AuthorizeRequestData>(request.session["authorizeRequestData"]));
            }
        } catch(error) {
            log.error(error.message, error);
            deferred.reject(error);
        }
        return deferred.promise;
    }

    /**
     * 
     * 
     * @static
     * @param {Request} request
     * @param {string} clientId
     * @returns {Q.Promise<AuthorizeRequestData>}
     * 
     * @memberOf SessionManager
     */
    static removeAuthorizeRequestData(request : Request, clientId : string) : Q.Promise<AuthorizeRequestData> {
        let deferred : Q.Deferred<any> = Q.defer();  
        try {
            if(request.session["authorizeRequestData"]) {
                let deletedAuthorizeRequestData : AuthorizeRequestData = request.session["authorizeRequestData"][clientId];
                delete request.session["authorizeRequestData"][clientId];
                deferred.resolve(deletedAuthorizeRequestData);
            } else {
                deferred.resolve(undefined);
            }
        } catch(error) {
            log.error(error.message, error);
            deferred.reject(error);
        }
        return deferred.promise;
    }
}