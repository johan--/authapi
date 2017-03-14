'use strict'
import { AuthorizationCode } from "../../entity/authcode";
import * as Q from 'q';

/**
 * @export
 * @interface IAuthDao
 */
export interface IAuthDao{
    createAuthCode(access: AuthorizationCode): Q.Promise<any>;    
    findAuthCode(criteria: any): Q.Promise<any>;
    removeAuthCode(criteria: any): Q.Promise<any>;
    getAuthBasedOnCode(criteria:any): Q.Promise<any>;    
}