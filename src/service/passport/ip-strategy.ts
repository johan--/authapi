'use strict'
import * as Q from "q";
import { DaoFactory } from "../../model/dao/factory";
import { IDaoFactory } from "../../model/dao/iDaoFactory";
import { IUserDao } from "../../model/dao/interface/user-dao";
import { User } from "../../model/entity/user";
import { Logger } from "../../util/logger";

const log = new Logger('IpStrategy');

export class IpStrategy {
    userDao: IUserDao;
    user: User;

    constructor(daoFactory: IDaoFactory) {
        this.userDao = daoFactory.getUserDao();
    }

    /**
     * @param {User} user
     * @param {*} done
     * @returns
     * 
     * @memberOf IpStrategy
     */
    public registerOrLoginIpUser(user: User): Q.Promise<User> {
        log.debug("registerOrLoginIpUser : ", user.username);
        let deferred : Q.Deferred<any> = Q.defer();

        this.userDao.getUserByUserName(user.username)
        .then((foundUser: User) => {
            if(foundUser) {
                return this.loginIpUser(foundUser.id, user);
            } else {
                return this.registerIpUser(user);
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
     * @memberOf IpStrategy
     */
    public registerIpUser(user: User): Q.Promise<User> {
        log.debug("registerIpUser : ", user);
        return this.userDao.createUser(user);
    }

    /**
     * 
     * 
     * @param {string} id
     * @param {User} user
     * @returns {Q.Promise<User>}
     * 
     * @memberOf IpStrategy
     */
    public loginIpUser(id: string, user: User): Q.Promise<User> {
        log.debug("registerIpUser : ", user);
        return this.userDao.updateUser(id, user);
    }
}