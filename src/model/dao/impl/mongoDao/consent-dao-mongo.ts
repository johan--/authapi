'use strict'
import * as mongoose from "mongoose";
import { ConsentSchema } from "./schema/consent-schema";
import { Consent } from "../../../entity/consent";
import { IConsentDao } from '../../interface/consent-dao';
import { Helper } from "../../../../util/helper";
import { Logger } from '../../../../util/logger';
import * as Q from 'q';

const log = new Logger('Consent-Dao-Mongo');

type ConsentType = Consent & mongoose.Document;

export class ConsentDaoMongoose implements IConsentDao {
    ConsentModel: mongoose.Model<ConsentType>;

    constructor(mongooseDbConnection: mongoose.Connection) {
        this.ConsentModel = mongooseDbConnection.model<ConsentType>('Consent', ConsentSchema)
    }

    /**
     * Create consent
     * 
     * @param {Consent} consent
     * @returns {Q.Promise<any>}
     * 
     * @memberOf ConsentDaoMongoose
     */
    createConsent(consent: Consent): Q.Promise<any> {
        log.debug("createConsent: for user : " + consent.user + ", client : " + consent.client);
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {
            this.ConsentModel.create(consent, (error: any, consent: Consent) => {
                if(error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(consent);
                }
            });
        } catch (err) {
            deferred.reject(err);
            log.error(err.message, err);
        }
        return deferred.promise;
    }

    /**
     * Find consent based on criteria
     * 
     * @param {*} criteria
     * @returns {Q.Promise<any>}
     * 
     * @memberOf ConsentDaoMongoose
     */
    findConsent(criteria: any): Q.Promise<any> {
        log.debug("findConsent: " + JSON.stringify(criteria));
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {
            this.ConsentModel.findOne(criteria, (error: any, consent: Consent) => {
                if(error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(consent);
                }
            });
        } catch (err) {
            deferred.reject(err);
            log.error(err.message, err);
        }
        return deferred.promise;
    }

    /**
     * Remove consent based on criteria
     * 
     * @param {*} criteria
     * @returns {Q.Promise<any>}
     * 
     * @memberOf ConsentDaoMongoose
     */
    removeConsent(criteria: any): Q.Promise<any> {
        log.debug("removeConsent: " + JSON.stringify(criteria));
        let deferred : Q.Deferred<any> = Q.defer(); 
        try {
            this.ConsentModel.remove(criteria, (error: any) => {
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
}