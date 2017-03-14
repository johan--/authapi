'use strict'
import { IProfileTransform } from "../../interface/profile-transform";
import { User } from "../../../model/entity/user";
import { Helper } from "../../../util/helper";
import { Logger } from '../../../util/logger';

const log = new Logger('OrcidDataTransformUtil');

export class TwitterUtil implements IProfileTransform {
    /**
     * @param {*} twitterProfile
     * @returns {User}
     * 
     * @memberOf TwitterUtil
     */
    public createUserFromProfile(twitterProfile: any): User {
        log.debug("twitterProfile::", twitterProfile);
        return twitterProfile;
    }
}