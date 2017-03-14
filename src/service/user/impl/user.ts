'use strict'
import * as Q from "q";
import { Request} from "express";
import { DaoFactory } from "../../../model/dao/factory";
import { IUserDao } from "../../../model/dao/interface/user-dao";
import { User } from "../../../model/entity/user";
import { IUserService } from "../interface/user";
import { Logger } from '../../../util/logger';
import { Helper } from '../../../util/helper';
import { SessionManager, SessionKeys } from '../../../util/session';
import { ITokenManager } from '../../../token/interface/tokenmanager';

const log = new Logger('UserService');

export class UserService implements IUserService {
    userDao : IUserDao;
    tokenManager : ITokenManager;

    constructor(daoFactory: DaoFactory, tokenManager : ITokenManager) {
        this.userDao = daoFactory.getUserDao();
        this.tokenManager = tokenManager;
    }

    /**
     * 
     * 
     * @returns {Q.Promise<Array<User>>}
     * 
     * @memberOf UserService
     */
    listUser(): Q.Promise<Array<User>> {
        log.debug("listUser");
        let deferred : Q.Deferred<any> = Q.defer(); 
        this.userDao.listUser()
        .then((users: Array<User>) => {
            if (users && users.length > 0) {
				users.forEach(function (eachUser, index, myarray) {
					eachUser.accessToken = null;
					eachUser.credential = null;
                    eachUser.username = null;
                    eachUser.email = null;
					eachUser.registrationVerificationToken = null;
				});
			}
            deferred.resolve(users);
        })
        .fail((err : Error) => { deferred.reject(err); })
        .done();

        return deferred.promise;
	}

    /**
     * 
     * 
     * @param {string} id
     * @returns {Q.Promise<User>}
     * 
     * @memberOf UserService
     */
	getUserById(id: string): Q.Promise<User> {
        log.debug("getUserById: userId : " + id);
        let deferred : Q.Deferred<any> = Q.defer(); 

        this.userDao.getUserByUserId(id)
        .then((user : any) => {
            user.credential = null;
            user.accessToken = null;
            deferred.resolve(user);
         })
        .fail((err : Error) => { deferred.reject(err); })
        .done();

        return deferred.promise;
	}

    /**
     * 
     * 
     * @param {string} id
     * @param {*} updatedInformation
     * @returns {Q.Promise<User>}
     * 
     * @memberOf UserService
     */
	updateUser(id: string, updatedInformation: any): Q.Promise<User> {
        log.debug("updateUser: userId : " + id, updatedInformation);
        let deferred : Q.Deferred<any> = Q.defer(); 

        let userUpdateDiff : any = {};
        if(updatedInformation.firstName) { userUpdateDiff.firstName = updatedInformation.firstName; }
        if(updatedInformation.lastName) { userUpdateDiff.lastName = updatedInformation.lastName; }
        if(updatedInformation.dob) { userUpdateDiff.dob = updatedInformation.dob; }
        if(updatedInformation.jobTitle) { userUpdateDiff.jobTitle = updatedInformation.jobTitle; }
        if(updatedInformation.organization) { userUpdateDiff.organization = updatedInformation.organization; }
        if(updatedInformation.gender) { userUpdateDiff.gender = updatedInformation.gender; }
        if(updatedInformation.mobilePhone) { userUpdateDiff.mobilePhone = updatedInformation.mobilePhone; }
        if(updatedInformation.fax) { userUpdateDiff.fax = updatedInformation.fax; }
        if(updatedInformation.address) { userUpdateDiff.address = updatedInformation.address; }


        this.userDao.updateUser(id, userUpdateDiff)
        .then((updatedUser : User) => {
            updatedUser.credential = null;
            updatedUser.accessToken = null;
            deferred.resolve(updatedUser);
        })
        .fail((err : Error) => { deferred.reject(err); })
        .done();

        return deferred.promise;
	}

    /**
     * 
     * 
     * @param {string} id
     * @returns {Q.Promise<any>}
     * 
     * @memberOf UserService
     */
	removeUser(id: string): Q.Promise<any> {
        log.debug("removeUser: userId : " + id);
        let deferred : Q.Deferred<any> = Q.defer(); 

        this.userDao.removeUser(id)
        .then((removedUser: User) => {
            let removeUser = { "username": removedUser.username, "firstName": removedUser.firstName, "lastName": removedUser.lastName, };
            deferred.resolve(removedUser);
        })
        .fail((err : Error) => { deferred.reject(err); })
        .done();

        return deferred.promise;
	}
}