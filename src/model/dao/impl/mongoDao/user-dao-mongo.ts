'use strict'
import * as mongoose from "mongoose";
import { UserSchema } from "./schema/user-schema";
import { AccessSchema } from "./schema/access-schema";
import { User } from "../../../entity/user";
import { AuthorizationCode } from "../../../entity/authcode";
import { Consent } from "../../../entity/consent";
import { Client } from "../../../entity/client";
import { AccessToken } from "../../../entity/access-token";
import { Access } from "../../../entity/access";
import { IUserDao } from '../../interface/user-dao';
import { Helper } from "../../../../util/helper";
import { Logger } from '../../../../util/logger';
import * as Q from 'q';

const log = new Logger('User-Dao-Mongo');

type UserType = User & mongoose.Document;
type AccessType = Access & mongoose.Document;


export class UserDaoMongoose implements IUserDao {
	UserModel: mongoose.Model<UserType>;
	AccessModel: mongoose.Model<AccessType>;
	
	constructor(mongooseDbConnection: mongoose.Connection) {
		this.UserModel = mongooseDbConnection.model<UserType>('User', UserSchema);
		this.AccessModel = mongooseDbConnection.model<AccessType>('Access', AccessSchema)
	}

	/**
	 * Create user
	 * 
	 * @param {User} userInput
	 * @returns {Q.Promise<any>}
	 * 
	 * @memberOf UserDaoMongoose
	 */
	createUser(userInput: User): Q.Promise<any> {
		log.debug("createUser : username: " + userInput.username);
        let deferred : Q.Deferred<any> = Q.defer(); 
		this.UserModel.create(userInput, (error: any, user: User) => {
			if(error) {
				deferred.reject(error);
			} else {
				deferred.resolve(user);
			}
		});
        return deferred.promise;
	}

	/**
	 * Get user by id
	 * 
	 * @param {string} id
	 * @returns {Q.Promise<any>}
	 * 
	 * @memberOf UserDaoMongoose
	 */
	getUserByUserId(id: string): Q.Promise<any> {
		log.debug("getUserByUserId : id: " + id);
        let deferred : Q.Deferred<any> = Q.defer(); 
		this.UserModel.findById(id.toString(), (error: any, user: User) => {
			if(error) {
				deferred.reject(error);
			} else {
				deferred.resolve(user);
			}
		});
        return deferred.promise;
	}

	/**
	 * Get user by username
	 * 
	 * @param {string} username
	 * @returns {Q.Promise<any>}
	 * 
	 * @memberOf UserDaoMongoose
	 */
	getUserByUserName(username: string): Q.Promise<any> {
		log.debug("getUserByUserName : username: " + username);
        let deferred : Q.Deferred<any> = Q.defer(); 
		this.UserModel.findOne({ username }, (error: any, user: User) => {
			if(error) {
				deferred.reject(error);
			} else {
				deferred.resolve(user);
			}
		});
        return deferred.promise;
	}

	/**
	 * Get user by authtoken 
	 * 
	 * @param {string} accessToken
	 * @returns {Q.Promise<any>}
	 * 
	 * @memberOf UserDaoMongoose
	 */
	getUserByAuthToken(accessToken: string): Q.Promise<any> {
		//	this.UserModel.findOne({ accessToken: { $elemMatch: tokenSearchCriteria } }, callback);
		log.debug("getUserByAuthToken");
        let deferred : Q.Deferred<any> = Q.defer(); 
		let userModel = this.UserModel;
		let tokenSearchCriteria = {
			token: accessToken,
			expiresOn: { $gte: new Date().getTime() }
		}
		this.AccessModel.findOne(tokenSearchCriteria, function (err: Error, acces: Access) {
			if (err) {
				deferred.reject(err);
			} else if (acces) {
				userModel.findById(acces.user.toString(), (error: Error, user: User) => {
					if(error) {
						deferred.reject(error);
					} else {
						deferred.resolve(user);
					}
				});
			}
			else {
				deferred.resolve(null);
			}
		});
        return deferred.promise;
	}

	/**
	 * Search users
	 * 
	 * @param {Object} searchCriteria
	 * @returns {Q.Promise<any>}
	 * 
	 * @memberOf UserDaoMongoose
	 */
	searchUsers(searchCriteria: Object): Q.Promise<any> {
		log.debug("searchUsers : searchCriteria: " + JSON.stringify(searchCriteria));
        let deferred : Q.Deferred<any> = Q.defer(); 
        this.UserModel.find(searchCriteria, (error: any, users: Array<User>) => {
			if(error) {
				deferred.reject(error);
			} else {
				deferred.resolve(users);
			}
		});
        return deferred.promise;
	}

	/**
	 * List user, only 1
	 * 
	 * @param {Object} searchCriteria
	 * @returns {Q.Promise<any>}
	 * 
	 * @memberOf UserDaoMongoose
	 */
	listUser(): Q.Promise<any> {
		log.debug("listUser");
        let deferred : Q.Deferred<any> = Q.defer(); 
        this.UserModel.find(null, (error: any, users: Array<User>) => {
			if(error) {
				deferred.reject(error);
			} else {
				deferred.resolve(users);
			}
		});
        return deferred.promise;
	}

	/**
	 * Update user
	 * 
	 * @param {string} id
	 * @param {Object} updatedData
	 * @returns {Q.Promise<any>}
	 * 
	 * @memberOf UserDaoMongoose
	 */
	updateUser(id: string, updatedData: Object): Q.Promise<any> {
		log.debug("updateUser : id: " + id);
        let deferred : Q.Deferred<any> = Q.defer(); 
        this.UserModel.findByIdAndUpdate(id.toString(), { $set: updatedData }, { new: true }, (err: any, user: User) => {
			if (err) {
				deferred.reject(err);
			} else if (user) {
				deferred.resolve(user);
			} else {
				deferred.reject(new Error("No user with this id"));
			}
		});
        return deferred.promise;
	}

	/**
	 * Remove user bu id
	 * 
	 * @param {string} id
	 * @returns {Q.Promise<any>}
	 * 
	 * @memberOf UserDaoMongoose
	 */
	removeUser(id: string): Q.Promise<any> {
		log.debug("removeUser : id : " + id);
        let deferred : Q.Deferred<any> = Q.defer(); 
		this.UserModel.findByIdAndRemove(id.toString(), null, (err: any, user: User) => {
			if (err) {
				deferred.reject(err);
			} else if (user) {
				deferred.resolve(user);
			} else {
				deferred.reject(new Error("No user with this id"));
			}
		});
        return deferred.promise;
	}

	/**
	 * validate and update auth token
	 * 
	 * @param {string} accessToken
	 * @param {number} newExpirationTime
	 * @returns {Q.Promise<any>}
	 * 
	 * @memberOf UserDaoMongoose
	 */
	validateAndUpdateAuthToken(accessToken: string, newExpirationTime: number): Q.Promise<any> {
		log.debug("validateAndUpdateAuthToken");
        let deferred : Q.Deferred<any> = Q.defer(); 
		let tokenSearchCriteria: Object = {
			idToken: accessToken,
			expiresOn: { $gte: new Date().getTime() }

		};
		let updatedData: Object = {
			$set: { "expiresOn": newExpirationTime }
		};

		try {
			this.AccessModel.findOneAndUpdate(tokenSearchCriteria, updatedData, function (err: any, doc: Access) {
				let result: any = {};
				if (err || typeof doc == 'undefined' || doc == null) {
					log.error(err.message, err);
					result["isValidToken"] = false;
					deferred.resolve(result);
				}
				else {
					log.debug("validateAndUpdateAuthToken : fetched Access for user : " + doc.user + ", client :" + doc.client);
					result["isValidToken"] = true;
					result["idToken"] = doc.idToken;
					deferred.resolve(result);
				}
			});
		} catch (err) {
			deferred.reject(err);
			log.error(err.message, err);
		}
        return deferred.promise;
	}

	addAuthorizationCodeForUser(id: string, authCode: AuthorizationCode, callback: (error: any, user: User) => void): void {

	}

	addConsentForUser(id: string, consent: Consent, callback: (error: any, user: User) => void): void {

	}

	addAccessTokenForUser(id: string, accessToken: AccessToken, callback: (error: any, user: User) => void): void {

	}

	removeAuthorizationCodeForUser(id: string, authCode: AuthorizationCode, callback: (error: any, user: User) => void): void {

	}

	removeConsentForUser(id: string, consent: Consent, callback: (error: any, user: User) => void): void {

	}

	updateAccessTokenForUser(id: string, accessToken: AccessToken, callback: (error: any, user: User) => void): void {

	}

	updateAuthorizationCodeForUser(id: string, authCode: AuthorizationCode, callback: (error: any, user: User) => void): void {

	}

	updateConsentForUser(id: string, consent: Consent, callback: (error: any, user: User) => void): void {

	}

	removeAccessTokenForUser(id: string, accessToken: AccessToken, callback: (error: any, user: User) => void): void {

	}
}