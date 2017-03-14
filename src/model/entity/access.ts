'use strict'
import cryptoUtil = require('crypto');
import { Request } from "express";
import { User } from "./user";
import { Helper } from "../../util/helper";
import { Logger } from '../../util/logger';
import { ITokenManager } from '../../token/tokenmanager';
import { TokenManager } from '../../token/tokenmanager-impl';

const log = new Logger('model/entity/helper/user-factory');
const tokenManager : ITokenManager = new TokenManager();

/**
 * @export
 * @class Access
 */
export class Access {
    token: string;
    type: string;
    idToken: string;
    scope: Array<string>;
    expiresIn: number;
    expiresOn : number;
    user: string;
    auth: string;
    client: string;

	/**
	 * Create access data
	 * 
	 * @static
	 * @param {string} username
	 * @param {string} userType
	 * @param {*} userClientInfo
	 * @param {*} client
	 * @param {User} user
	 * @param {*} [actualClient]
	 * @returns {Access}
	 * 
	 * @memberOf Access
	 */
	static createAccessData(username : string, userType : string, userClientInfo : any, client: any, user: User, actualClient? : any): Access {
		let now: number = new Date().getTime();
		let newExpirationTime: number = Helper.getNewExpirationTime();
        log.debug('createAccessData : username : ' +  username);
		let access: Access = {
			user: user.id,
			idToken: tokenManager.createJwtToken(username, userType, now, userClientInfo, actualClient ? actualClient.clientSecret : null),
			token: cryptoUtil.createHash('md5').update(Math.random() + '').digest('hex'),
			client: client,
			expiresOn: newExpirationTime,
			type: "user-access-token",
			scope: ['openid', 'mail', 'profile'],
			expiresIn: 3600,
			auth: null
		}
		return access;
	}
}