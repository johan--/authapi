'use strict'

import * as chai from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import { IUserDao } from "../../src/model/dao/interface/user-dao";
import { UserDaoMongoose } from "../../src/model/dao/impl/mongoDao/user-dao-mongo";
import { IAccessDao } from "../../src/model/dao/interface/access-dao";
import { AccessDaoMongoose } from "../../src/model/dao/impl/mongoDao/access-dao-mongo";
import { IRefreshDao } from "../../src/model/dao/interface/refresh-dao";
import { RefreshDaoMongoose } from "../../src/model/dao/impl/mongoDao/refresh-dao-mongo";
import { IClientDao } from "../../src/model/dao/interface/client-dao";
import { ClientDaoMongoose } from "../../src/model/dao/impl/mongoDao/client-dao-mongo";
import { IAuthDao } from "../../src/model/dao/interface/auth-dao";
import { AuthDaoMongoose } from "../../src/model/dao/impl/mongoDao/auth-dao-mongo";
import { IConsentDao } from "../../src/model/dao/interface/consent-dao";
import { ConsentDaoMongoose } from "../../src/model/dao/impl/mongoDao/consent-dao-mongo";
import { IDaoFactory } from "../../src/model/dao/iDaoFactory"

export class MockDaoFactory implements IDaoFactory {
    userDao : IUserDao;
    accessDao : IAccessDao;
    refreshDao : IRefreshDao;
    consentDao : IConsentDao;
    authDao : IAuthDao;
    clientDao : IClientDao;

    constructor() {
        this.userDao = <any>sinon.createStubInstance(UserDaoMongoose);
        this.accessDao = <any>sinon.createStubInstance(AccessDaoMongoose);
        this.refreshDao = <any>sinon.createStubInstance(RefreshDaoMongoose);
        this.authDao = <any>sinon.createStubInstance(AuthDaoMongoose);
        this.consentDao = <any>sinon.createStubInstance(ConsentDaoMongoose);
        this.clientDao = <any>sinon.createStubInstance(ClientDaoMongoose);
    }

    public getUserDao() : IUserDao {
        return this.userDao;
    }

    public getAccessDao() : IAccessDao {
        return this.accessDao;
    }

    public getClientDao() : IClientDao {
        return this.clientDao;
    }

    public getRefreshDao() : IRefreshDao {
        return this.refreshDao;
    }

    public getConsentDao() : IConsentDao {
        return this.consentDao;
    }

    public getAuthDao() : IAuthDao {
        return this.authDao;
    }
}