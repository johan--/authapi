'use strict'
import { User } from "../../entity/user";
import * as Q from 'q';

/**
 * @export
 * @interface IUserDao
 */
export interface IUserDao {
	createUser(user: User): Q.Promise<any>;
	getUserByUserId(id: string): Q.Promise<any>;
	getUserByUserName(username: string): Q.Promise<any>;
	getUserByAuthToken(accessToken: string): Q.Promise<any>;
	searchUsers(searchCriteria: Object): Q.Promise<any>;
	listUser(): Q.Promise<any>;
	updateUser(id: string, updatedData: Object): Q.Promise<any>;
	removeUser(id: string): Q.Promise<any>;
	validateAndUpdateAuthToken(accessToken:string,newExpirationTime:number): Q.Promise<any>;
	//validateAuthTokenWithPromise(tokenSearchCriteria:Object) : Promise<Boolean>;
}