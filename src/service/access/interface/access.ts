'use strict'

import * as Q from 'q';
import { User } from "../../../model/entity/user";
import { Access } from "../../../model/entity/access";

/**
 * @export
 * @interface IAccessService
 */
export interface IAccessService {
    insertAccessToken(access : Access) : Q.Promise<Access>
    createUserAccessToken(username : string, userType : string, userClientInfo : any, user: User) : Q.Promise<User>;
    createUserAccessTokenForClient(username : string, userType : string, userClientInfo : any, clientId : string, user: User) : Q.Promise<User>;
}