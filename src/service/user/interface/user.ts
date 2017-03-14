'use strict'

import * as Q from 'q';
import { User } from "../../../model/entity/user";

/**
 * @export
 * @interface IUserService
 */
export interface IUserService {	
    listUser(): Q.Promise<Array<User>>;
	getUserById(id: string): Q.Promise<User>;
	updateUser(id: string, updatedInformation: any): Q.Promise<User>;
	removeUser(id: string): Q.Promise<any>;
}