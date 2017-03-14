'use strict'
import * as Q from "q";
import { DaoFactory } from "../../model/dao/factory";
import { IUserDao } from "../../model/dao/interface/user-dao";
import { User } from "../../model/entity/user";
import { Logger } from "../../util/logger";

const log = new Logger('SocialStrategy');

export class SocialStrategy {

    userDao: IUserDao;
    user: User;

    constructor(daoFactory: DaoFactory) {
        this.userDao = daoFactory.getUserDao();
    }

    /**
     * 
     * 
     * @param {User} user
     * @returns {Q.Promise<User>}
     * 
     * @memberOf SocialStrategy
     */
    public registerOrLoginSocialUser(user: User): Q.Promise<User> {
        log.debug("registerOrLoginIpUser : ", user.username);
        let deferred : Q.Deferred<any> = Q.defer();

        this.userDao.getUserByUserName(user.username)
        .then((foundUser: User) => {
            if(foundUser) {
                return this.loginSocialUser(foundUser.id, user);
            } else {
                this.registerSocialUser(user);
            }
        })
        .then((userDetails : User) => { deferred.resolve(userDetails); })
        .fail((err : Error) => { deferred.reject(err); }).done();

        return deferred.promise;
    }

    /**
     * 
     * 
     * @param {User} user
     * @returns {Q.Promise<User>}
     * 
     * @memberOf SocialStrategy
     */
    public registerSocialUser(user: User): Q.Promise<User> {
         log.debug("registerSocialUser : ", user);
        return this.userDao.createUser(user);
    }

    /**
     * 
     * 
     * @private
     * @param {string} id
     * @param {User} user
     * @returns {Q.Promise<User>}
     * 
     * @memberOf SocialStrategy
     */
    public loginSocialUser(id: string, user: User): Q.Promise<User> {
        log.debug("loginSocialUser : ", user);
        return this.userDao.updateUser(id, user);
    }

}