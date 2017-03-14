'use strict'
import { Access } from "../../entity/access";
import * as Q from 'q';

/**
 * @export
 * @interface IAccessDao
 */
export interface IAccessDao{
    insertToAccess(access: Access): Q.Promise<any>;
    updateAccess(access: Access, updatedData: any): Q.Promise<any>;
    findAccess(criteria: any): Q.Promise<any>;
    removeAccess(criteria: any): Q.Promise<any>;
    getToken(criteria: any): Q.Promise<any>;
}