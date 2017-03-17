'use strict'
import { IUserDao } from "./interface/user-dao";
import { IAccessDao } from "./interface/access-dao";
import { IRefreshDao } from "./interface/refresh-dao";
import { IClientDao } from "./interface/client-dao";
import { IAuthDao } from "./interface/auth-dao";
import { IConsentDao } from "./interface/consent-dao";

export interface IDaoFactory {
    getUserDao() : IUserDao;    
    getAccessDao() : IAccessDao;
    getClientDao() : IClientDao;
    getRefreshDao() : IRefreshDao;
    getConsentDao() : IConsentDao;
    getAuthDao() : IAuthDao;
}