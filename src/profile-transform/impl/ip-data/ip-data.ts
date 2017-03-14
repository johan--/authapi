'use strict'
import { IProfileTransform } from "../../interface/profile-transform";
import { User } from "../../../model/entity/user";
import { Helper } from "../../../util/helper";
import { Logger } from '../../../util/logger';

const log = new Logger('profile-tranform/IpDataTransformUtil');

export class IpDataTransformUtil implements IProfileTransform {
    /**
     * @param {*} profile
     * @returns {User}
     * 
     * @memberOf IpDataTransformUtil
     */
    public createUserFromProfile(profile : any): User {
        let ipaddress : string = profile.ipAddress;
        let ipDetails : HTMLBodyElement = profile.ipDetails;

        console.log("ipDetails", ipDetails);
        let jsonResponse = JSON.parse(ipDetails.toString());

        let user: User = {
                userType: 'ip',
                id: '',
                username: ipaddress,
                email: "annonymous",
                firstName: null,
                lastName: null,
                credential: {},
                organization: jsonResponse.data.party_id,
                jobTitle: '',
                dob: new Date(),
                createdOn: new Date().getTime(),
                isValidated: jsonResponse.data.access_type,
                registrationVerificationToken: '',
                registrationVerificationTokenExpiry: new Date().getTime(),
                accessToken: [],
                language: 'English',
                mobilePhone: '',
                homePhone: '',
                businessPhone: '',
                fax: '',
                address: {
                    addressLine1: '',
                    addressLine2: '',
                    state: '',
                    city: '',
                    country: '',
                    zipCode: ''
                },

                consents : [],
                clients : []
            }
        return user;
    }
}