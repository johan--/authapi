'use strict'
import { IProfileTransform } from "../../interface/profile-transform";
import { User } from "../../../model/entity/user";
import { OrcidUser } from "../../../model/entity/orcid-user";
import { Institution } from "../../../model/entity/institution";
import { Funding } from "../../../model/entity/funding";
import { Address } from "../../../model/entity/address";
import { Client } from "../../../model/entity/client";
import { Consent } from "../../../model/entity/consent";
import { Helper } from "../../../util/helper";
import { Logger } from '../../../util/logger';

const log = new Logger('OrcidDataTransformUtil');

export class OrcidDataTransformUtil implements IProfileTransform {
    /**
     * Create user from orcid profile
     * 
     * @static
     * @param {*} orcidProfile
     * @returns {User}
     * 
     * @memberOf OrcidDataTransformUtil
     */
    public createUserFromProfile(orcidProfile: any): User {
        let profile = JSON.stringify(orcidProfile);
        let parsedProfile = JSON.parse(profile);

        let member : OrcidUser = {
            userType: 'author',
            id: '',
            lastUpdatedOn: parsedProfile['orcid-profile']['orcid-history']['last-modified-date'],
            orcidId: parsedProfile['orcid-profile']['orcid-identifier']['path'],
            username: parsedProfile['orcid-profile']['orcid-identifier']['path'],
            email: null,
            firstName: null,
            lastName: null,
            credential: {},
            organization: '',
            jobTitle: '',
            dob: new Date(),
            createdOn: new Date().getTime(),
            isValidated: true,
            registrationVerificationToken: '',
            registrationVerificationTokenExpiry: new Date().getTime(),
            accessToken: [{
                clientId: '',
                username: parsedProfile['orcid-profile']['orcid-identifier']['path'],
                expiry: Helper.getNewExpirationTime(),
                token: '',
                type : "user-access-token",
                idToken : "",
                scope : ""
            }],
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

            consents : Array<Consent>(),
            clients : Array<Client>(),

            otherNames: [],
            creditName: '',
            orcidAccessToken:'',
            authorInstitution: [],
            fundings: [],
            coAuthors: [],
        };

        if(parsedProfile['orcid-profile']['orcid-bio']['personal-details']['given-names']){
            member.firstName = parsedProfile['orcid-profile']['orcid-bio']['personal-details']['given-names']['value'];
        }

        if(parsedProfile['orcid-profile']['orcid-bio']['personal-details']['family-name']){
            member.lastName = parsedProfile['orcid-profile']['orcid-bio']['personal-details']['family-name']['value'];
        }

        log.debug('Given name: ' + JSON.stringify(parsedProfile['orcid-profile']['orcid-bio']['personal-details']['given-names']['value']));
        let contactDetails = parsedProfile['orcid-profile']['orcid-bio']['contact-details'];
        if (contactDetails && contactDetails['email'] && contactDetails['email'][0]) {
            log.debug('email: ' + contactDetails['email'][0]['value']);
            member.email = contactDetails['email'][0]['value'];
            member.username = contactDetails['email'][0]['value'];
        }

        if (contactDetails && contactDetails['address'] && contactDetails['address']["country"]) {
             member.address.country = contactDetails['address']["country"]["value"];
        }

        member.otherNames = OrcidDataTransformUtil.getOtherNames(parsedProfile['orcid-profile']['orcid-bio']['personal-details']['other-names']);

        let creditNameContent: any = parsedProfile['orcid-profile']['orcid-bio']['personal-details']['credit-name'];
        if (creditNameContent) {
            member.creditName = creditNameContent['value'];
        }
        member.authorInstitution = OrcidDataTransformUtil.getAuthorInstitutions(parsedProfile['orcid-profile']['orcid-activities']);
        member.fundings = OrcidDataTransformUtil.getFundings(parsedProfile['orcid-profile']['orcid-activities']);
        member.coAuthors = OrcidDataTransformUtil.getCoAuthors(parsedProfile['orcid-profile']['orcid-activities']);

        if (member.email) {
            return member;
        }
        else {
            return member;
        }
    }

    /**
     * Get co authors
     * 
     * @static
     * @param {*} activities
     * @returns {Array<Object>}
     * 
     * @memberOf OrcidDataTransformUtil
     */
    public static getCoAuthors(activities: any): Array<Object> {
        let coAuthors : any = [];
        if(activities && activities["orcid-works"] && activities["orcid-works"]["orcid-work"]){
            let orcidWorks = activities["orcid-works"]["orcid-work"];
            orcidWorks.forEach(function(orcidWork: any) {
                if(orcidWork["work-contributors"] && orcidWork["work-contributors"]["contributor"]){
                    let workContributors = orcidWork["work-contributors"]["contributor"];
                    workContributors.forEach(function(contributor:any) {
                        let coAuthor:any = {};
                        coAuthors.push(coAuthor);

                        let orcidContributor = contributor["contributor-orcid"];                        
                        if(orcidContributor){
                            let contributorOrcidUrl:string = orcidContributor["uri"];
                            let coAuthorId = contributorOrcidUrl.substring(contributorOrcidUrl.lastIndexOf("/")+1);
                            coAuthor.orcidId = coAuthorId;
                        }                      
                        
                        if(contributor["credit-name"]){
                            coAuthor.name = contributor["credit-name"]["value"];
                        }
                        if(contributor["contributor-email"]){
                            coAuthor.email = contributor["contributor-email"]["value"];
                        }
                        if(contributor["contributor-attributes"]){
                            coAuthor.role = contributor["contributor-attributes"]["contributor-role"];
                        }
                    });
                }
            });
        }
        return coAuthors;
    }

    /**
     * Get funding
     * 
     * @static
     * @param {*} activities
     * @returns {Array<Funding>}
     * 
     * @memberOf OrcidDataTransformUtil
     */
    public static getFundings(activities: any): Array<Funding> {
        let fundings: Array<Funding> = [];
        if (activities && activities["funding-list"] && activities["funding-list"]["funding"]) {
            activities["funding-list"]["funding"].forEach(function (funding: any) {
                fundings.push(OrcidDataTransformUtil.createFunding(funding));
            });
        }
        return fundings;
    }

    /**
     * create funding
     * 
     * @static
     * @param {*} orcidFunding
     * @returns {Funding}
     * 
     * @memberOf OrcidDataTransformUtil
     */
    public static createFunding(orcidFunding: any): Funding {
        let funding: any = {}
        funding.fundingType = orcidFunding["funding-type"];
        funding.visibility = orcidFunding["visibility"];
        let orcidOrganization = orcidFunding["organization"];
        if (orcidOrganization) {
            funding.fundingOrganisation = orcidOrganization["name"];
            let orcidOrganizationAddress = orcidOrganization["address"];
            if (orcidOrganizationAddress) {
                funding.address = {
                    city: orcidOrganizationAddress["city"],
                    country: orcidOrganizationAddress["country"],
                    region: orcidOrganizationAddress["region"]
                }
            }
            if (orcidFunding["amount"]) {
                funding.currencyCode = orcidFunding["amount"]["currency-code"]
            }
            if (orcidFunding["start-date"]) {
                funding.startDate = OrcidDataTransformUtil.formatDate(orcidFunding["start-date"]);
            }
            if (orcidFunding["end-date"]) {
                funding.endDate = OrcidDataTransformUtil.formatDate(orcidFunding["end-date"]);
            }
            if (orcidFunding["url"]) {
                funding.fundingUrl = orcidFunding["url"]["value"];
            }
            if (orcidFunding["funding-external-identifiers"]) {
                funding.grantNumber = OrcidDataTransformUtil.getGrantNumber(orcidFunding["funding-external-identifiers"]["funding-external-identifier"]);
            }
        }
        return funding;
    }

    /**
     * Get grant number
     * 
     * @static
     * @param {*} orcidFundingIdentifier
     * @returns {Number}
     * 
     * @memberOf OrcidDataTransformUtil
     */
    public static getGrantNumber(orcidFundingIdentifier: any): Number {
        let grantNumber: any = null;
        if (orcidFundingIdentifier) {
            orcidFundingIdentifier.forEach(function (fundingExternalIdentifier: any) {
                if (fundingExternalIdentifier["funding-external-identifier-type"] === "GRANT_NUMBER") {
                    grantNumber = fundingExternalIdentifier["funding-external-identifier-value"];
                }
            });
        }
        return grantNumber;
    }

    /**
     * format date
     * 
     * @static
     * @param {*} orcidDate
     * @returns {String}
     * 
     * @memberOf OrcidDataTransformUtil
     */
    public static formatDate(orcidDate: any): String {
        if (orcidDate["day"]) {
            return (orcidDate["month"]["value"] + "/" + orcidDate["day"]["value"] + "/" + orcidDate["year"]["value"]);
        } else {
            return (orcidDate["month"]["value"] + "/" + orcidDate["year"]["value"]);
        }
    }

    /**
     * Get author institution
     * 
     * @static
     * @param {*} activities
     * @returns {Array<Institution>}
     * 
     * @memberOf OrcidDataTransformUtil
     */
    public static getAuthorInstitutions(activities: any): Array<Institution> {
        let institutions: Array<Institution> = [];
        if (activities && activities["affiliations"] && activities["affiliations"]["affiliation"]) {
            activities["affiliations"]["affiliation"].forEach(function (affiliation: any) {
                if (affiliation["type"] === "EMPLOYMENT") {
                    institutions.push(OrcidDataTransformUtil.createInstitution(affiliation));
                }
            });
        }
        return institutions;
    }

    /**
     * create institution
     * 
     * @static
     * @param {*} employmentAffiliation
     * @returns {Institution}
     * 
     * @memberOf OrcidDataTransformUtil
     */
    public static createInstitution(employmentAffiliation: any): Institution {
        let institution: any = {};
        institution.name = employmentAffiliation["organization"]["name"];
        if (employmentAffiliation["organization"]["address"]) {
            let orcidOrganizationAddress = employmentAffiliation["organization"]["address"];
            if (orcidOrganizationAddress) {
                institution.address = {
                    city: orcidOrganizationAddress["city"],
                    country: orcidOrganizationAddress["country"],
                    region: orcidOrganizationAddress["region"]
                }
            }
        }

        institution.type = employmentAffiliation["type"];
        institution.visibility = employmentAffiliation["visibility"];
        if (employmentAffiliation["start-date"]) {
            institution.startDate = OrcidDataTransformUtil.formatDate(employmentAffiliation["start-date"])
        }
        if (employmentAffiliation["end-date"]) {
            institution.endDate = OrcidDataTransformUtil.formatDate(employmentAffiliation["end-date"])
        }
        institution.jobTitle = employmentAffiliation["role-title"];
        institution.department = employmentAffiliation["department-name"];
        return institution;
    }

    /**
     * get other names
     * 
     * @static
     * @param {*} otherNamesForUser
     * @returns {Array<string>}
     * 
     * @memberOf OrcidDataTransformUtil
     */
    public static getOtherNames(otherNamesForUser: any): Array<string> {
        let otherNames: Array<string> = [];
        if (otherNamesForUser && otherNamesForUser["other-name"]) {
            otherNamesForUser["other-name"].forEach(function (otherName: any) {
                otherNames.push(otherName["value"]);
            });
        }
        return otherNames;
    }
}