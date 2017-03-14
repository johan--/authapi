'use strict'
import { RefreshToken } from "../../entity/refresh-token";
import * as Q from 'q';

/**
 * @export
 * @interface IRefreshDao
 */
export interface IRefreshDao{
    createRefreshToken(access: RefreshToken): Q.Promise<any>;
    updateRefreshToken(access: RefreshToken, updatedData: any): Q.Promise<any>;
    findRefreshToken(criteria: any): Q.Promise<any>;
    removeRefreshToken(criteria: any): Q.Promise<any>;
    getToken(criteria: any): Q.Promise<any>;
}