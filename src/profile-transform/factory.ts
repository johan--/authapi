'use strict'
import { IProfileTransform } from "./interface/profile-transform";
import { FacebookUtil } from "./impl/facebook/facebook";
import { GoogleUtil } from "./impl/google/google";
import { IpDataTransformUtil } from "./impl/ip-data/ip-data";
import { LinkedinUtil } from "./impl/linkedin/linkedin";
import { OrcidDataTransformUtil } from "./impl/orcid/orcid";
import { TwitterUtil } from "./impl/twitter/twitter";

export enum ProfileName { IP, facebook, google, linkedin, orcid, twitter }

export class ProfileTransformFactory {
    /**
     * @static
     * @param {ProfileName} name
     * @returns {IProfileTransform}
     * 
     * @memberOf ProfileTransformFactory
     */
    public static getProfileTransformUtil(name : ProfileName) : IProfileTransform {
        switch (name) {
            case ProfileName.facebook:
                return new FacebookUtil();
            case ProfileName.google:
                return new GoogleUtil();
            case ProfileName.IP:
                return new IpDataTransformUtil();
            case ProfileName.linkedin:
                return new LinkedinUtil();
            case ProfileName.orcid:
                return new OrcidDataTransformUtil();
            case ProfileName.twitter:
                return new TwitterUtil();
            default:
                return null;
        }
    }
}