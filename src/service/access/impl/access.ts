'use strict'

import * as Q from "q";
import * as mongoose from "mongoose";
import { DaoFactory } from "../../../model/dao/factory";
import { IDaoFactory } from "../../../model/dao/iDaoFactory";
import { IUserDao } from "../../../model/dao/interface/user-dao";
import { IAccessDao } from "../../../model/dao/interface/access-dao";
import { IClientDao } from "../../../model/dao/interface/client-dao";
import { User } from "../../../model/entity/user";
import { Access } from "../../../model/entity/access";
import { Client } from "../../../model/entity/client";
import { AccessToken } from "../../../model/entity/access-token";
import { IAccessService } from "../interface/access";
import { Logger } from '../../../util/logger';
import { Helper } from '../../../util/helper';
import { SessionManager, SessionKeys } from '../../../util/session';
import { ITokenManager } from '../../../token/interface/tokenmanager';

const log = new Logger('AccessService');

export class AccessService implements IAccessService {
    userDao: IUserDao;
    accessDao: IAccessDao;
    clientDao: IClientDao;
    tokenManager : ITokenManager;

    constructor(daoFactory: IDaoFactory, tokenManager : ITokenManager) {
        log.debug("Intialized Access Service : ");
        this.tokenManager = tokenManager;
        this.userDao = daoFactory.getUserDao();
        this.accessDao = daoFactory.getAccessDao();
        this.clientDao = daoFactory.getClientDao();
    }

    /**
     *
     *
     * @param {Access} access
     * @returns {Q.Promise<Access>}
     *
     * @memberOf AccessService
     */
    insertAccessToken(access : Access) : Q.Promise<Access> {
        return this.accessDao.insertToAccess(access);
    }

    /**
     * Create access token for user
     *
     * @param {string} username
     * @param {string} userType
     * @param {*} userClientInfo
     * @param {User} user
     * @returns {Q.Promise<any>}
     *
     * @memberOf AccessService
     */
    createUserAccessToken(username : string, userType : string, userClientInfo : any, user: User) : Q.Promise<User> {
        log.debug("createAccessToken : username : " + user.username);
        let deferred : Q.Deferred<any> = Q.defer();
        let removeCriteria = { user: new mongoose.mongo.ObjectId(user.id), expiresOn: { $lt: new Date().getTime() } }

        this.accessDao.removeAccess(removeCriteria)
        .then(() => { return this.createAndInsertToAccess(username, userType, userClientInfo, null, user); })
        .then((user : User) => { deferred.resolve(user); })
        .fail((err : Error) => { deferred.reject(err); })
        .done();

        return deferred.promise;
    }

    /**
     * Create access token for user from client
     *
     * @param {string} username
     * @param {string} userType
     * @param {*} userClientInfo
     * @param {string} clientId
     * @param {User} user
     * @returns {Q.Promise<any>}
     *
     * @memberOf AccessService
     */
    createUserAccessTokenForClient(username : string, userType : string, userClientInfo : any, clientId : string, user: User) : Q.Promise<User> {
        log.debug("createAccessToken : username : " + user.username);
        let deferred : Q.Deferred<any> = Q.defer();
        let removeCriteria = { user: new mongoose.mongo.ObjectId(user.id), expiresOn: { $lt: new Date().getTime() } }

        this.accessDao.removeAccess(removeCriteria)
        .then(() => { return this.clientDao.getClientByClientId(clientId); })
        .then((client : Client) => {
            let clientObjId = new mongoose.mongo.ObjectId((<any>client).id);
            return this.createAndInsertToAccess(username, userType, userClientInfo, clientObjId, user)
         })
        .then((user : User) => { deferred.resolve(user); })
        .fail((err : Error) => { deferred.reject(err); })
        .done();

        return deferred.promise;
    }


    /**
     * create and insert to access
     *
     * @param {string} username
     * @param {string} userType
     * @param {*} userClientInfo
     * @param {*} client
     * @param {User} user
     * @returns {Q.Promise<any>}
     *
     * @memberOf AccessService
     */
    private createAndInsertToAccess(username : string, userType : string, userClientInfo : any, client: any, user: User) : Q.Promise<any> {
        let deferred : Q.Deferred<any> = Q.defer();

        Access.createAccessData(username, userType, userClientInfo, client, user, null)
        .then((access : Access) => {
            access.auth = null;
            return this.accessDao.insertToAccess(access);
        })
        .then((newAccess : Access) => {
            let accesstoken: any = {};
            accesstoken.token = newAccess.token;
            accesstoken.idToken = newAccess.idToken;
            user.accessToken.push(accesstoken);
            deferred.resolve(user);
        })
        .fail((err : Error) => {
            deferred.reject(err);
        })
        .done();

        return deferred.promise;
    }

    // Not required
    /*
    clearExpiredAndCreateNewToken(accessTokens: Array<AccessToken>, clientInfo: any, username: string, userType: string): Array<AccessToken> {
        let selfTokenManager = this.tokenManager;
        let updatedAccessTokens: Array<AccessToken> = [];
        let rightNow: number = new Date().getTime();
        let newExpirationTime: Number = Helper.getNewExpirationTime();

        let accessTokenToAdd: AccessToken = {
            token: selfTokenManager.createJwtToken(username, userType, rightNow, clientInfo),
            type: "user-access-token",
            idToken: selfTokenManager.createJwtToken(username, userType, rightNow, clientInfo),
            expiry: newExpirationTime,
            username: username,
            clientId: clientInfo,
            scope: ""
        }

        let existingValidTokenFound = false;

        if (accessTokens != undefined) {
            accessTokens.forEach(function (value, index, myarray) {
                log.debug("value['expiry'] ", value['expiry'], "  rightNow:", rightNow);
                if (value['expiry'] > rightNow) {
                    if (value.clientId == clientInfo && selfTokenManager.authenticateJwtToken(username, value['token'])) {
                        existingValidTokenFound = true;
                        log.debug("mathcing token found for given client id and username : " + value['token']);
                        value['expiry'] = newExpirationTime;
                        accessTokenToAdd = value;
                    } else {
                        log.debug("keeping existing token as not expired")
                        updatedAccessTokens.push(value);
                    }

                } else {
                    log.debug("removing existing token as expired")
                }
            });
        }
        log.debug("existingValidTokenFound : " + existingValidTokenFound);
        updatedAccessTokens.push(accessTokenToAdd);

        return updatedAccessTokens;
    }*/
}
