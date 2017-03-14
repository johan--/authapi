'use strict'
import { IUserDao } from "./interface/user-dao";
import { UserDaoMongoose } from "./impl/mongoDao/user-dao-mongo";
import { IAccessDao } from "./interface/access-dao";
import { AccessDaoMongoose } from "./impl/mongoDao/access-dao-mongo";
import { IRefreshDao } from "./interface/refresh-dao";
import { RefreshDaoMongoose } from "./impl/mongoDao/refresh-dao-mongo";
import { IClientDao } from "./interface/client-dao";
import { ClientDaoMongoose } from "./impl/mongoDao/client-dao-mongo";
import { IAuthDao } from "./interface/auth-dao";
import { AuthDaoMongoose } from "./impl/mongoDao/auth-dao-mongo";
import { IConsentDao } from "./interface/consent-dao";
import { ConsentDaoMongoose } from "./impl/mongoDao/consent-dao-mongo";
import { Connection } from "mongoose";

export class DaoFactory {
    private userDao : IUserDao;
    private accessDao : IAccessDao;
    private refreshDao : IRefreshDao;
    private consentDao : IConsentDao;
    private authDao : IAuthDao;
    private clientDao : IClientDao;

    /**
     * Creates an instance of DaoFactory, Initialize factory
     * 
     * @param {Connection} connection
     * 
     * @memberOf DaoFactory
     */
    constructor(connection : Connection) {
        this.userDao = new UserDaoMongoose(connection);
        this.accessDao = new AccessDaoMongoose(connection);
        this.refreshDao = new RefreshDaoMongoose(connection);
        this.authDao = new AuthDaoMongoose(connection);
        this.consentDao = new ConsentDaoMongoose(connection);
        this.clientDao = new ClientDaoMongoose(connection);
    }

    /**
     * Get user dao
     * 
     * @returns {IUserDao}
     * 
     * @memberOf DaoFactory
     */
    public getUserDao() : IUserDao{
        return this.userDao;
    }

    /**
     * Get access dao
     * 
     * @returns {IAccessDao}
     * 
     * @memberOf DaoFactory
     */
    public getAccessDao() : IAccessDao{
        return this.accessDao;
    }

    /**
     * Get client dao
     * 
     * @static
     * @returns {IClientDao}
     * 
     * @memberOf DaoFactory
     */
    public getClientDao() : IClientDao{
        return this.clientDao;
    }

    /**
     * Get refrest dao
     * 
     * @static
     * @returns {IRefreshDao}
     * 
     * @memberOf DaoFactory
     */
    public getRefreshDao() : IRefreshDao{
        return this.refreshDao;
    }

    /**
     * Get consent dao
     * 
     * @static
     * @returns {IConsentDao}
     * 
     * @memberOf DaoFactory
     */
    public getConsentDao() : IConsentDao{
        return this.consentDao;
    }

    /**
     * Get auth dao
     * 
     * @static
     * @returns {IAuthDao}
     * 
     * @memberOf DaoFactory
     */
    public getAuthDao() : IAuthDao{
        return this.authDao;
    }
}