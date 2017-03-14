'use strict'
import { Consent } from "../../entity/consent";
import * as Q from 'q';

/**
 * @export
 * @interface IConsentDao
 */
export interface IConsentDao{
    createConsent(access: Consent): Q.Promise<any>;    
    findConsent(criteria: any): Q.Promise<any>;
    removeConsent(criteria: any): Q.Promise<any>;
}