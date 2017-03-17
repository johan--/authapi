'use strict'
import { UserDaoMongoose } from "../../../../src/model/dao/impl/mongoDao/user-dao-mongo";
import { AuthDaoMongoose } from "../../../../src/model/dao/impl/mongoDao/auth-dao-mongo";
import { ConsentDaoMongoose } from "../../../../src/model/dao/impl/mongoDao/consent-dao-mongo";
import { ClientDaoMongoose } from "../../../../src/model/dao/impl/mongoDao/client-dao-mongo";
import { EncryptionUtil } from "../../../../src/util/encryption";
import { Helper } from "../../../../src/util/helper";
import { TokenFactory, TokenManagerName } from '../../../../src/token/factory';
import { ITokenManager } from '../../../../src/token/interface/tokenmanager';
import { User } from "../../../../src/model/entity/user";
import { Client } from "../../../../src/model/entity/client";
import IClient = require("../../../../src/model/entity/client");

import DbConfig = require("db-config");
import DbConnection = require("db-connection");
import mongoose = require("mongoose");
import { DaoFactory } from '../../../../src/model/dao/factory';
import ApplicationConfig = require("../../../../src/config/application-config");

let connection: mongoose.Connection;
var Q = require('q');
var ObjectID = require("mongodb").ObjectID;

export class DBUtility {

    tokenManager : ITokenManager;
    userDao : UserDaoMongoose;
    authDao : AuthDaoMongoose;       
    consentDao : ConsentDaoMongoose;     
    clientDao : ClientDaoMongoose;  

    userModel : any;
    accessModel : any; 
    authModel : any; 
    consentModel : any; 
    clientModel : any; 

    constructor() {
        connection= DbConnection.get("mongo", DbConfig.get(ApplicationConfig.MONGO_DB_CONFIG)).get();
        let daoFactory = new DaoFactory(connection);

        this.tokenManager = TokenFactory.getTokenManager(TokenManagerName.JWT);
        this.userDao = <UserDaoMongoose>daoFactory.getUserDao();
        this.authDao = <AuthDaoMongoose>daoFactory.getAuthDao();
        this.consentDao = <ConsentDaoMongoose>daoFactory.getConsentDao();
        this.clientDao = <ClientDaoMongoose>daoFactory.getClientDao();

        this.userModel = this.userDao.UserModel;
        this.accessModel = this.userDao.AccessModel;
        this.authModel = this.authDao.AuthModel;
        this.consentModel = this.consentDao.ConsentModel;
        this.clientModel = this.clientDao.ClientModel;
    }

    createUser(user: any) : Q.Promise<any> {
        let deferred : Q.Deferred<any> = Q.defer();  
        this.getUserMongoObject(user)
        .then((userObj : User) => { return this.userDao.createUser(user); })
        .then((createdUser : User) => { deferred.resolve(createdUser); })
        .fail((err : Error) => { deferred.reject(err); })

        return deferred.promise;      
    }

    RemoveAuthorizeSuiteRecords(username: string) : Q.Promise<any> {
        let deferred : Q.Deferred<any> = Q.defer();  
        this.findUser(username)
        .then((user : any) =>{ return this.removeAccessModel(user); })
        .then((user : any) =>{ return this.removeAuthModel(user); })
        .then((user : any) =>{ return this.removeConsentModel(user); })
        .then((user : any) =>{ return this.removeUserModel(user); })
        .then((user : any) => { deferred.resolve(); })
        .fail((err : Error) => { deferred.reject(err); }).done();
        return deferred.promise;          
    }

    createClient(clientDetails : any) : Q.Promise<any> {
        let client = {
            id: "",
            username: clientDetails.username,
            name: clientDetails.appName,
            clientId: "",
            clientSecret: "",
            redirect_uris: [ clientDetails.redirectURL ],
            credentialsFlow: true
        };

        client.clientId = Helper.generateClientId(client.name);
        client.clientSecret = Helper.generateClientSecret(client.clientId, client.name);
        return this.clientDao.addClient(client);
    }

    removeClient(username : any) : Q.Promise<any> {
        let deferred : Q.Deferred<any> = Q.defer();
        this.clientModel.remove({ username : username}, function(err:Error) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    }

    private findUser(username : string) : Q.Promise<any> {
        let userDeferred : Q.Deferred<any> = Q.defer();
        this.userModel.findOne({ username }, function(err: any, user: any) {
            if(err) { 
                userDeferred.reject(err);
            }         
            else {
                userDeferred.resolve(user);
            }
        });
        return userDeferred.promise;
    }

    private removeUserModel(user : User) : Q.Promise<any> {
        let userDeferred : Q.Deferred<any> = Q.defer();
        this.userModel.remove({ username : user.username }, function(err:Error) {
            if(err) { 
                userDeferred.reject(err);
            }         
            else {
                userDeferred.resolve(user);
            }
        });
        return userDeferred.promise;
    }

    private removeConsentModel(user : User) : Q.Promise<any> {
        let consentDeferred : Q.Deferred<any> = Q.defer();
        this.consentModel.remove({ user : (<any>user)._id }, function(err:Error) {
            if(err) { 
                consentDeferred.reject(err);
            }         
            else {
                consentDeferred.resolve(user);
            }
        });
        return consentDeferred.promise;
    }

    private removeAuthModel(user : User) : Q.Promise<any> {
        let authDeferred : Q.Deferred<any> = Q.defer();
        this.authModel.remove({ user : (<any>user)._id }, function(err:Error) {
            if(err) { 
                authDeferred.reject(err);
            }         
            else {
                authDeferred.resolve(user);
            }
        });
        return authDeferred.promise;
    }

    private removeAccessModel(user : User) : Q.Promise<any> {
        let accessDeferred : Q.Deferred<any> = Q.defer();
        this.accessModel.remove({ user : (<any>user)._id }, function(err:Error) {
            if(err) { 
                accessDeferred.reject(err);
            }         
            else {
                accessDeferred.resolve(user);
            }
        });
        return accessDeferred.promise;
    }

    private getUserMongoObject(user : any) : Q.Promise<any> {
        let deferred : Q.Deferred<any> = Q.defer();
        let rightNow: number = new Date().getTime();
		let newExpirationTime: Number = Helper.getNewExpirationTime();   
        let clientInfo: string = '%7B%22agent%22:%22Mozilla/5.0%20(Windows%20NT%2010.0;%20Win64;%20x64)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/53.0.2785.143%20Safari/537.36%22,%22ip%22:%22182.74.16.174,%2010.136.97.61%22%7D';

        this.tokenManager.createJwtToken({ username : user.username, userType : user.userType, time : rightNow, clientInfo : clientInfo }, this.tokenManager.secret)
        .then((genToken : string) => {
            let userResultant: any = {
                userType: user.userType,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                credential: {
                    username: user.username,
                    password: EncryptionUtil.encrypt(user.password)
                },
                accessToken: {
                    clientId: clientInfo,
                    username: user.username,
                    expiry: newExpirationTime,
                    token: genToken
                },
                createdOn: rightNow,
                displayName: user.firstName + " " + user.lastName,
                registrationVerificationToken: null,
                isValidated: true
            };
            deferred.resolve(userResultant);
        })
        .fail((err : Error) => { deferred.reject(err); }).done();

        return deferred.promise;
    }
}