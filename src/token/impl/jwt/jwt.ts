'use strict'
import jwt = require('jwt-simple');
import { ITokenManager } from '../../interface/tokenmanager';
import { Logger } from '../../../util/logger';
import * as Q from 'q';

const log = new Logger('token/jwt/JWTManager');

export class JWTManager implements ITokenManager {

    public secret = '14mS3cr3tK3y4ndH4sh3r@#$%$#@<<>>>>><<<<FISH';

    /**
     * 
     * 
     * @returns {Q.Promise<string>}
     * 
     * @memberOf JWTManager
     */
    generateRandomToken() : Q.Promise<string> {
        let deferred : Q.Deferred<any> = Q.defer(); 
        let token: string = Math.random().toString(36).substring(2, 10);
        deferred.resolve(token);

        return deferred.promise;
    }

    /**
     * 
     * 
     * @param {*} data
     * @param {string} secretKey
     * @returns {Q.Promise<string>}
     * 
     * @memberOf JWTManager
     */
    createJwtToken(data : any, secretKey : string) : Q.Promise<string> {
        let deferred : Q.Deferred<any> = Q.defer(); 
        let token = jwt.encode(data, secretKey);
        deferred.resolve(token);

        return deferred.promise;
    }

    /**
     * 
     * 
     * @param {string} token
     * @param {string} secretKey
     * @param {boolean} verifyToken
     * @returns {Q.Promise<string>}
     * 
     * @memberOf JWTManager
     */
    decodeJwtToken(token: string, secretKey : string, verifyToken : boolean) : Q.Promise<string> {
        let deferred : Q.Deferred<any> = Q.defer(); 
        let decodedToken : string = '';
        try {
            decodedToken = jwt.decode(token, secretKey, !verifyToken);
            deferred.resolve(decodedToken);
        } catch (error) {
            deferred.reject(error);
        }
        return deferred.promise;
    }

    /**
     * 
     * 
     * @param {string} username
     * @param {string} token
     * @param {string} secretKey
     * @returns {Q.Promise<boolean>}
     * 
     * @memberOf JWTManager
     */
    authenticateJwtToken(username: string, token: string, secretKey : string) : Q.Promise<boolean> {
        log.debug("authenticateJwtToken username submitted: " + username);
        let deferred : Q.Deferred<any> = Q.defer(); 
        let decoded :any = null;
        try {
            decoded = jwt.decode(token, secretKey);
        } catch (error) {
            log.error(error.message, error);
            deferred.reject(new Error("Failed to authenticate the token."));
        }

        // get the username from token and validate if that is for given user
        log.debug("AuthenticateJwtToken Decoded Username: " + decoded.username);
        if (username === decoded.username) {            
            deferred.resolve(true);
        }
        else {
            log.debug("Failed to authenticate...");
            deferred.reject(new Error("Failed to authenticate the token."));
        }
        return deferred.promise;
    }
}