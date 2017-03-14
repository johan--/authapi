'use strict'

import { Request } from 'express';
import * as Q from 'q';
import { User } from "../../../model/entity/user";

/**
 * @export
 * @interface IAccessService
 */
export interface IAccessService {
    createUserAccessToken(username : string, userType : string, userClientInfo : any, user: User) : Q.Promise<User>;
    createUserAccessTokenForClient(username : string, userType : string, userClientInfo : any, clientId : string, user: User) : Q.Promise<User>;
}