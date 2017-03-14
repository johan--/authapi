'use strict'
import { IProfileTransform } from "../../interface/profile-transform";
import { User } from "../../../model/entity/user";
import { SocialUser } from "../../../model/entity/social-user";
import { Client } from "../../../model/entity/client";
import { Consent } from "../../../model/entity/consent";
import { Helper } from "../../../util/helper";
import { Logger } from '../../../util/logger';

const log = new Logger('profile-tranform/FacebookUtil');

export class FacebookUtil implements IProfileTransform {
	/**
	 * @param {*} facebookProfile
	 * @returns {User}
	 * 
	 * @memberOf FacebookUtil
	 */
    public createUserFromProfile(facebookProfile: any): User {
		log.debug("facebookProfile::", facebookProfile);

		let member : SocialUser =  {
            socialId: facebookProfile.id,
			userType: 'facebook_user',
            id: '',
			username: facebookProfile.emails[0].value,
			email: facebookProfile.emails[0].value,
			credential: null,
			accessToken: [],
			firstName: facebookProfile._json.first_name,
			lastName: facebookProfile._json.last_name,
			organization: null,
			jobTitle: null,
			dob: null,
			language: null,
			mobilePhone: null,
			homePhone: null,
			businessPhone: null,
			fax: null,
			address: null,
			createdOn: new Date().getTime(),
			isValidated: true,
			registrationVerificationToken: null,
			registrationVerificationTokenExpiry: null,
			consents : Array<Consent>(),
    		clients : Array<Client>()
		};
		return member;
	}
}