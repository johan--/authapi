'use strict'
import * as Q from "q";
import { DaoFactory } from "../../../model/dao/factory";
import { IDaoFactory } from "../../../model/dao/iDaoFactory";
import { IClientDao } from "../../../model/dao/interface/client-dao";
import { IUserDao } from "../../../model/dao/interface/user-dao";
import { Client } from "../../../model/entity/client";
import { User } from "../../../model/entity/user";
import { IClientService } from "../interface/client";
import { Logger } from '../../../util/logger';
import { Helper } from '../../../util/helper';
import { SessionManager, SessionKeys } from '../../../util/session';
import { ITokenManager } from '../../../token/interface/tokenmanager';

const log = new Logger('ClientService');

export class ClientService implements IClientService {
    clientDao : IClientDao;
    userDao : IUserDao

    constructor(daoFactory: IDaoFactory) {
        log.debug("Intialized Client Service : ");
        this.clientDao = daoFactory.getClientDao();
        this.userDao = daoFactory.getUserDao();
    }

    /**
     * This is Stupid why do we bind client with user email, It should have been user id.
     * 
     * This will create issues when we move to optional email ids through Linking Of Accounts
     * 
     * @param {string} username
     * @param {string} appName
     * @param {Array<string>} redirectURIS
     * @returns {Q.Promise<Client>}
     * 
     * @memberOf ClientService
     */
	addClient(username : string, appName : string, redirectURIS : Array<string>): Q.Promise<Client> {
		log.debug("in addClient");
        let clientId = Helper.generateClientId(appName);
        let clientSecret = Helper.generateClientSecret(clientId, appName);
        let deferred : Q.Deferred<any> = Q.defer();
        this.userDao.getUserByUserName(username)
        .then((user : User) : Q.Promise<User> => {
            let deferred : Q.Deferred<any> = Q.defer();
            if(user) {
                deferred.resolve(<User>user)
            } else {
                deferred.reject(new Error("no user found with given username:" + username));
            }
            return deferred.promise;
        })
        .then((user : User) : Q.Promise<Client> => {
            let client : Client = new Client(username, appName, clientId, clientSecret, true, redirectURIS);
            return this.clientDao.addClient(client);
        })
        .then((client : Client) : void => { deferred.resolve(client); })
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
     * @memberOf ClientService
     */
    removeClient(id: string): Q.Promise<any> {
		log.debug("removeClient : " + id);
        return this.clientDao.removeClient(id);
	}

    /**
     * 
     * 
     * @param {string} username
     * @returns {Q.Promise<Array<Client>>}
     * 
     * @memberOf ClientService
     */
    getClientsByUsername(username : string): Q.Promise<Array<Client>> {
		log.debug("getClientsByUsername " + username);
        return this.clientDao.getClientsByUsername(username);
	}

    /**
     * 
     * 
     * @param {string} id
     * @param {*} updatedInformation
     * @returns {Q.Promise<Client>}
     * 
     * @memberOf ClientService
     */
	updateClientById(id: string, updatedInformation: any): Q.Promise<Client> {
		log.debug("updateClientById : id : " + id, updatedInformation);
        let clientUpdateDiff : any = {};
        if(updatedInformation.name) { clientUpdateDiff.name = updatedInformation.name; }
        if(updatedInformation.redirect_uris) { clientUpdateDiff.redirect_uris = updatedInformation.redirect_uris; }
        return this.clientDao.updateClientById(id, clientUpdateDiff);
	}

    /**
     * 
     * 
     * @param {string} id
     * @returns {Q.Promise<Client>}
     * 
     * @memberOf ClientService
     */
	resetClientSecretById(id: string): Q.Promise<Client> {
		log.debug("resetClientSecretById : id : " + id);
        let deferred : Q.Deferred<any> = Q.defer();
        this.clientDao.getClientById(id)
        .then((client : Client) => {
            client.clientSecret = Helper.generateClientSecret(client.clientId, client.name);
            return this.clientDao.updateClientById(id, client);
        })
        .then((updatedClient: Client) => { 
            deferred.resolve(updatedClient); 
        })
        .fail((err : Error) => { 
            deferred.reject(err); 
        })
        .done();
        return deferred.promise;
	}

    /**
     * 
     * 
     * @param {string} id
     * @param {string} secret
     * @returns {Q.Promise<Client>}
     * 
     * @memberOf ClientService
     */
    getClientByClientIdAndClientSecret(id: string, secret: string): Q.Promise<Client>{
		log.debug("getClientByClientIdAndClientSecret : id : " + id);
        return this.clientDao.getClientByClientIdAndSecret(id, secret);
    }

    /**
     * 
     * 
     * @param {string} id
     * @returns {Q.Promise<Client>}
     * 
     * @memberOf ClientService
     */
    getClientByClientId(id : string) : Q.Promise<Client>{
		log.debug("getClientByClientId : id : " + id);
        return this.clientDao.getClientByClientId(id);        
    }
}