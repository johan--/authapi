'use strict'
import { IProfileTransform } from "../../interface/profile-transform";
import { User } from "../../../model/entity/user";
import { SocialUser } from "../../../model/entity/social-user";
import { Client } from "../../../model/entity/client";
import { Consent } from "../../../model/entity/consent";
import { Helper } from "../../../util/helper";
import { Logger } from '../../../util/logger';

const log = new Logger('profile-tranform/GoogleUtil');

export class GoogleUtil implements IProfileTransform {
	/**
	 * @param {*} googleProfile
	 * @returns {User}
	 *
	 * @memberOf GoogleUtil
	 */
    public createUserFromProfile(googleProfile: any): User {
		log.debug("googleProfile::", googleProfile);

		let member : SocialUser = {
            socialId: googleProfile.id,
			userType: 'google_user',
            id: '',
			username: googleProfile.email,
			email: googleProfile.email,
			credential: null,
		    accessToken: [],
			firstName: googleProfile.name.givenName,
			lastName: googleProfile.name.familyName,
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
    		clients : Array<Client>(),
            organizationName : null
		};
		return member;
	}
}
