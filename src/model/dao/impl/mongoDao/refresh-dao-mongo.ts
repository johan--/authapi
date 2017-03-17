'use strict'
import * as mongoose from "mongoose";
import { RefreshSchema } from "./schema/refresh-schema";
import { RefreshToken } from "../../../entity/refresh-token";
import { IRefreshDao } from '../../interface/refresh-dao';
import { Helper } from "../../../../util/helper";
import { Logger } from '../../../../util/logger';
import * as Q from 'q';

const log = new Logger('Refresh-Dao-Mongo');

type RefreshType = RefreshToken & mongoose.Document;

export class RefreshDaoMongoose implements IRefreshDao {
    RefreshModel: mongoose.Model<RefreshType>;

    constructor(mongooseDbConnection: mongoose.Connection) {
        this.RefreshModel = mongooseDbConnection.model<RefreshType>('Refresh', RefreshSchema)
    }

    /**
     * Create refresh token
     * 
     * @param {RefreshToken} refresh
     * @returns {Q.Promise<any>}
     * 
     * @memberOf RefreshDaoMongoose
     */
    createRefreshToken(refresh: RefreshToken): Q.Promise<any> {
        log.debug("createRefreshToken: for auth : " + refresh.auth);
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {
            this.RefreshModel.create(refresh, (error: any, refresh: RefreshToken) => {
                if(error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(refresh);
                }
            });
        } catch (err) {
            deferred.reject(err);
            log.error(err.message, err);
        }
        return deferred.promise;
    }

    /**
     * Update refresh token
     * 
     * @param {RefreshToken} refresh
     * @param {*} updatedData
     * @returns {Q.Promise<any>}
     * 
     * @memberOf RefreshDaoMongoose
     */
    updateRefreshToken(refresh: RefreshToken, updatedData: any): Q.Promise<any> {
        log.debug("updateRefreshToken: " + JSON.stringify(refresh));
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {          
            this.RefreshModel.findOneAndUpdate(refresh, { $set: { expiresOn: updatedData } }, (error: any, refresh: RefreshToken) => {
                if(error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(refresh);
                }
            });
        } catch (err) {
            deferred.reject(err);
            log.error(err.message, err);
        }
        return deferred.promise;
    }

    /**
     * Find refresh token
     * 
     * @param {*} criteria
     * @returns {Q.Promise<any>}
     * 
     * @memberOf RefreshDaoMongoose
     */
    findRefreshToken(criteria: any): Q.Promise<any> {
        log.debug("findRefreshToken: " + JSON.stringify(criteria));
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {
            this.RefreshModel.find(criteria, (error: any, refresh: Array<RefreshToken>) => {
                if(error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(refresh);
                }
            });
        } catch (err) {
            deferred.reject(err);
            log.error(err.message, err);
        }
        return deferred.promise;
    }

    /**
     * Remove refresh token based on criteria
     * 
     * @param {*} criteria
     * @returns {Q.Promise<any>}
     * 
     * @memberOf RefreshDaoMongoose
     */
    removeRefreshToken(criteria: any): Q.Promise<any> {
        log.debug("removeRefreshToken: " + JSON.stringify(criteria));
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {
            this.RefreshModel.remove(criteria, (error: any) => {
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
     * Get token based on criteria
     * 
     * @param {*} criteria
     * @returns {Q.Promise<any>}
     * 
     * @memberOf RefreshDaoMongoose
     */
    getToken(criteria: any): Q.Promise<any> {
        log.debug("getToken: " + JSON.stringify(criteria));
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {
            this.RefreshModel.findOne(criteria, (error: any, refresh: RefreshToken) => {
                if(error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(refresh);
                }
            });
        } catch (err) {
            deferred.reject(err);
            log.error(err.message, err);
        }
        return deferred.promise;
    }
}