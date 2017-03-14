'use strict'
import * as mongoose from "mongoose";
import { AuthSchema } from "./schema/auth-schema";
import { AuthorizationCode } from "../../../entity/authcode";
import { IAuthDao } from '../../interface/auth-dao';
import { Helper } from "../../../../util/helper";
import { Logger } from '../../../../util/logger';
import * as Q from 'q';

const log = new Logger('Auth-Dao-Mongo');

type AuthType = AuthorizationCode & mongoose.Document;

export class AuthDaoMongoose implements IAuthDao {
    AuthModel: mongoose.Model<AuthType>;

    constructor(mongooseDbConnection: mongoose.Connection) {
        this.AuthModel = mongooseDbConnection.model<AuthType>('Auth', AuthSchema)
    }
    
    /**
     * Create auth object
     * 
     * @param {AuthorizationCode} auth
     * @returns {Q.Promise<any>}
     * 
     * @memberOf AuthDaoMongoose
     */
    createAuthCode(auth: AuthorizationCode): Q.Promise<any> {
        log.debug("createAuthCode, for user: " + auth.user + ", client : " + auth.client);
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {
            this.AuthModel.create(auth, function(err:Error, auth:AuthorizationCode){
                if(err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(auth);
                }
            });
        } catch (err) {
            deferred.reject(err);
            log.error(err.message, err);
        }
        return deferred.promise;
    }

    /**
     * find auth
     * 
     * @param {*} criteria
     * @param {(error: Error, auth: Array<AuthorizationCode>) => void} callback
     * @returns {Q.Promise<any>}
     * 
     * @memberOf AuthDaoMongoose
     */
    findAuthCode(criteria: any): Q.Promise<any> {
        log.debug("Find : auth: " + JSON.stringify(criteria));
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {
            this.AuthModel.find(criteria, (error: Error, auth: Array<AuthorizationCode>) => {
                if(error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(auth);
                }
            });
        } catch (err) {
            deferred.reject(err);
            log.error(err.message, err);
        }
        return deferred.promise;
    }

    /**
     * Remove auth object
     * 
     * @param {*} criteria
     * @returns {Q.Promise<any>}
     * 
     * @memberOf AuthDaoMongoose
     */
    removeAuthCode(criteria: any): Q.Promise<any> {
        log.debug("Remove : auth: " + JSON.stringify(criteria));
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {
            this.AuthModel.remove(criteria, (error: Error) => {
                if(error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve();
                }
            });
        } catch (err) {
            deferred.reject(err);
            log.error(err.message, err);
        }
        return deferred.promise;
    }

    /**
     * Get auth based on code
     * 
     * @param {*} criteria
     * @returns {Q.Promise<any>}
     * 
     * @memberOf AuthDaoMongoose
     */
    getAuthBasedOnCode(criteria: any): Q.Promise<any> {
        log.debug(" getAuthBasedOnCode : " + JSON.stringify(criteria));
        let deferred : Q.Deferred<any> = Q.defer(); 

        this.AuthModel.findOne(criteria).populate('accessTokens')
        .populate('refreshTokens')
        .populate('client')
        .exec(function (err: Error, auth: any) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(auth);
            }
        });
        return deferred.promise;
    }
}