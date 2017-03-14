'use strict'
import { Address } from "./address";
import { Client } from "./client";
import { Consent } from "./consent";
import { ICredential } from "./credential";
import { Helper } from "../../util/helper";

import cryptoUtil = require('crypto');
import { Request } from "express";
import { Logger } from '../../util/logger';
import { ITokenManager } from '../../token/tokenmanager';
import { TokenManager } from '../../token/tokenmanager-impl';
import { EncryptionUtil } from "../../util/encryption";

const log = new Logger('model/entity/helper/user-factory');
const tokenManager : ITokenManager = new TokenManager();

/**
 * @export
 * @class User
 */
export class User {
    id: string;
    userType: string;
    username: string;
    firstName: string;
    lastName: string;
    organization: string;
    jobTitle: string;
    dob: Date;
    language: string;
    mobilePhone: string;
    homePhone: string;
    businessPhone: string;
    fax: string;
    email: string;
    address: Address;
    credential: ICredential;
    createdOn: number;
    isValidated: boolean;
    registrationVerificationToken: string;
    registrationVerificationTokenExpiry: number;
    accessToken: Array<any>;
    clients: Array<Client>;
    consents: Array<Consent>;

    /**
     * @static
     * @param {Request} request
     * @returns {User}
     * 
     * @memberOf User
     */
    static createUserFromRequest(request: Request): User {
        log.debug('createUserFromRequest : request.body.username : ' + request.body.username.toLowerCase());
		let rightNow: number = new Date().getTime();
		let newExpirationTime: Number = Helper.getNewExpirationTime();
        let user: any = {
            userType: request.body.userType,
			username: request.body.username.toLowerCase(),
			firstName: request.body.firstName,
			lastName: request.body.lastName,
			organization: request.body.organization,
			jobTitle: request.body.jobTitle,
			dob: request.body.dob,
			language: request.body.language,
			mobilePhone: request.body.mobilePhone,
			homePhone: request.body.homePhone,
			businessPhone: request.body.businessPhone,
			fax: request.body.fax,
			email: request.body.email.toLowerCase(),
            address: request.body.address,
            credential: {
                username: request.body.username.toLowerCase(),
                password: EncryptionUtil.encrypt(request.body.password)
            },
			/*accessToken: {
				clientId: Helper.getUserClientInfo(request),
				username: request.body.username,
				expiry: newExpirationTime,
				token: tokenManager.createJwtToken(request.body.username, rightNow, Helper.getUserClientInfo(request))
			},*/
            createdOn: rightNow,
			displayName: request.body.firstName + " " + request.body.lastName,
			registrationVerificationToken: tokenManager.generateRandomToken(),
			registrationVerificationTokenExpiry : newExpirationTime,
			isValidated: false
        };

		return user;
    }
}