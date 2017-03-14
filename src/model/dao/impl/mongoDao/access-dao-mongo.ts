'use strict'
import * as mongoose from "mongoose";
import { Access } from "../../../entity/access";
import { IAccessDao } from '../../interface/access-dao';
import { Helper } from "../../../../util/helper";
import { AccessSchema } from "./schema/access-schema";
import { Logger } from '../../../../util/logger';
import * as Q from 'q';

const log = new Logger('Access-Dao-Mongo');

type AccessType = Access & mongoose.Document;

export class AccessDaoMongoose implements IAccessDao {
    AccessModel: mongoose.Model<AccessType>;

    constructor(mongooseDbConnection: mongoose.Connection) {
        this.AccessModel = mongooseDbConnection.model<AccessType>('Access', AccessSchema)
    }
    
    /**
     * @param {Access} access
     * @returns {Q.Promise<any>}
     * 
     * @memberOf AccessDaoMongoose
     */
    insertToAccess(access: Access): Q.Promise<any> {
        log.debug("insertToAccess, for user: " + access.user + ", client : " + access.client);
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {
            this.AccessModel.create(access, (error: any, access: Access) => {
                if(error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(access);
                }
            });
        } catch (err) {
            deferred.reject(err);
            log.error(err.message, err);
        }
        return deferred.promise;
    }

    /**
     * update access object
     * 
     * @param {Access} access
     * @param {*} updatedData
     * @returns {Q.Promise<any>}
     * 
     * @memberOf AccessDaoMongoose
     */
    updateAccess(access: Access, updatedData: any): Q.Promise<any> {
        log.debug("updateAccess, for user: " + access.user + ", client : " + access.client);
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {
            this.AccessModel.findOneAndUpdate(access, { $set: { expiresOn: updatedData } }, (error: any, access: Access) => {
                if(error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(access);
                }
            });
        } catch (err) {
            deferred.reject(err);
            log.error(err.message, err);
        }
        return deferred.promise;
    }

    /**
     * finding access
     * 
     * @param {*} criteria
     * @returns {Q.Promise<any>}
     * 
     * @memberOf AccessDaoMongoose
     */
    findAccess(criteria: any): Q.Promise<any> {
        log.debug("Find : access: " + JSON.stringify(criteria));
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {
            this.AccessModel.find(criteria, (error: any, access: Array<Access>) => {
                if(error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(access);
                }
            });
        } catch (err) {
            deferred.reject(err);
            log.error(err.message, err);
        }
        return deferred.promise;
    }
    
    /**
     * remove access
     * 
     * @param {*} criteria
     * @returns {Q.Promise<any>}
     * 
     * @memberOf AccessDaoMongoose
     */
    removeAccess(criteria: any): Q.Promise<any> {
        log.debug("removeAccess : Removing access");
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {
            this.AccessModel.remove(criteria, (error: any) => {
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
     * Get token
     * 
     * @param {*} criteria
     * @returns {Q.Promise<any>}
     * 
     * @memberOf AccessDaoMongoose
     */
    getToken(criteria: any) : Q.Promise<any> {
        log.debug("getToken : Getting token");
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {
            this.AccessModel.findOne(criteria, (err: any, access: Access) => {
                if(err){
                    deferred.reject(err);
                } else {
                    deferred.resolve(access);
                }
            });
        } catch (err) {
            deferred.reject(err);
            log.error(err.message, err);
        }
        return deferred.promise;
    }
}