'use strict'

import { Request } from 'express';
import * as Q from 'q';

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
        let result = req.session[key];
        result = result === undefined ? null : result;
        deferred.resolve(result);
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
        req.session[key] = value;
        deferred.resolve(value);
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
        SessionManager.get(req, SessionKeys.User_Details)
        .then((user : any) => {
            if(user && user["_id"]) {
                deferred.resolve(true);
            } else {
                deferred.resolve(false);
            }
        })
        return deferred.promise;
    }

    static sessionDestroy(req : Request) : Q.Promise<boolean> {
        let deferred : Q.Deferred<any> = Q.defer();
        req.session.destroy(function (err : Error) {
            if(err) {
                deferred.reject(err);
            }
			deferred.resolve(true);
		});
        return deferred.promise;
    }

/*    static getListElement(req : Request, listname : string, key : string) : Q.Promise<any> {
        if(listname === undefined || listname === null) {
            throw new Error("list name cannot be null or empty");
        }
        if(key === undefined || key === null) {
            throw new Error("key cannot be null or empty");
        }
        if(req.session[listname] === undefined || req.session[listname] === null){
            return null;
        }
        let result = req.session[listname][key];
        return result === undefined ? null : result;
    }

    static setListElement(req : Request, listname : string, key : string, value : any) : any {
        if(listname === undefined || listname === null) {
            throw new Error("list name cannot be null or empty");
        }
        if(key === undefined || key === null) {
            throw new Error("key cannot be null or empty");
        }
        req.session[listname] = req.session[listname] ? req.session[listname] : [];
        req.session[listname][key] = value;
    }*/
}