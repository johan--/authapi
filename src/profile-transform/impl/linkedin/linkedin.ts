'use strict'
import { IProfileTransform } from "../../interface/profile-transform";
import { User } from "../../../model/entity/user";
import { SocialUser } from "../../../model/entity/social-user";
import { Client } from "../../../model/entity/client";
import { Consent } from "../../../model/entity/consent";
import { Helper } from "../../../util/helper";
import { Logger } from '../../../util/logger';

const log = new Logger('profile-tranform/LinkedinUtil');

export class LinkedinUtil implements IProfileTransform {

    createUserFromProfile(linkedinProfile: any): User {
		log.debug("linkedinProfile::", linkedinProfile);

		let member : SocialUser = {
            socialId: linkedinProfile.id,
			userType: 'linkedin_user',
            id: '',
			username: linkedinProfile._json.emailAddress,
			email: linkedinProfile._json.emailAddress,
			credential: null,
			accessToken: [],
			firstName: linkedinProfile._json.firstName,
			lastName: linkedinProfile._json.lastName,
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
