'use strict'

import * as Q from "q";
import * as cryptoUtil from "crypto";
import { Request } from "express";
import { User } from "./user";
import { Helper } from "../../util/helper";
import { Logger } from '../../util/logger';
import { ITokenManager } from '../../token/interface/tokenmanager';
import { TokenFactory, TokenManagerName } from '../../token/factory';

const log = new Logger('model/entity/helper/user-factory');
const tokenManager : ITokenManager = TokenFactory.getTokenManager(TokenManagerName.JWT);

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
	static createAccessData(username : string, userType : string, userClientInfo : any, client: any, user: User, actualClient? : any): Q.Promise<Access> {
        let deferred : Q.Deferred<Access> = Q.defer<Access>();
		let now: number = new Date().getTime();
		let newExpirationTime: number = Helper.getNewExpirationTime();
        log.debug('createAccessData : username : ' +  username);
		tokenManager.createJwtToken(user, actualClient ? actualClient.clientSecret : tokenManager.secret)
		.then((jwtToken : string) => {
			let access: Access = {
				user: user.id,
				idToken: jwtToken,
				token: cryptoUtil.createHash('md5').update(Math.random() + '').digest('hex'),
				client: client,
				expiresOn: newExpirationTime,
				type: "user-access-token",
				scope: ['openid', 'mail', 'profile'],
				expiresIn: 3600,
				auth: null
			};
			deferred.resolve(access);
		})
		.fail((err : Error) => { deferred.reject(err); }).done();

		return deferred.promise;
	}
}
