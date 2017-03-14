'use strict'
import * as mongoose from "mongoose";
import { ClientSchema } from "./schema/client-schema";
import { UserSchema } from "./schema/user-schema";
import { Client } from "../../../entity/client";
import { User } from "../../../entity/user";
import { IClientDao } from '../../interface/client-dao';
import { Helper } from "../../../../util/helper";
import { Logger } from '../../../../util/logger';
import * as Q from 'q';

const log = new Logger('Client-Dao-Mongo');

type ClientType = Client & mongoose.Document;
type UserType = User & mongoose.Document;

export class ClientDaoMongoose implements IClientDao {

    ClientModel: mongoose.Model<ClientType>;

    constructor(mongooseDbConnection: mongoose.Connection) {
        this.ClientModel = mongooseDbConnection.model<ClientType>('Client', ClientSchema);
    }

    /**
     * Add client
     * 
     * @param {Client} client
     * @returns {Q.Promise<any>}
     * 
     * @memberOf ClientDaoMongoose
     */
    addClient(client: Client): Q.Promise<any> {
        let self = this;
        let deferred : Q.Deferred<any> = Q.defer(); 

        self.ClientModel.create(client, (error: any, clientCreated: Client) => {
            if(error) {
                deferred.reject(error);
            } else {
                deferred.resolve(clientCreated);
            }
        });
        return deferred.promise;
    }

    /**
     * Get client by username
     * 
     * @param {string} username
     * @returns {Q.Promise<any>}
     * 
     * @memberOf ClientDaoMongoose
     */
    getClientsByUsername(username: string): Q.Promise<any> {
        log.debug("getClientsByUsername : ",username);
        let deferred : Q.Deferred<any> = Q.defer(); 
        this.ClientModel.find({ username: username, $or : [ { deleted : false }, { deleted : null } ] }, (error: any, clients: Array<Client>) => {
            if(error) {
                deferred.reject(error);
            } else {
                deferred.resolve(clients);
            }
        });
        return deferred.promise;
    }

    /**
     * get client by client Id 
     * 
     * @param {string} clientId
     * @returns {Q.Promise<any>}
     * 
     * @memberOf ClientDaoMongoose
     */
    getClientByClientId(clientId: string): Q.Promise<any> {
        log.debug("getClientByClientId: ", clientId);
        let deferred : Q.Deferred<any> = Q.defer(); 
        this.ClientModel.findOne( { "clientId" : clientId, $or : [ { deleted : false }, { deleted : null } ] }, function(err:any, client:Client){
            if (err) {
                deferred.reject(err);
            } else if (client) {
                deferred.resolve(client);
            } else {
                deferred.reject(new Error("No client with this id"));
            }
        });
        return deferred.promise;
    }

    /**
     * Get client by client id and secret
     * 
     * @param {string} clientId
     * @param {string} clientSecret
     * @returns {Q.Promise<any>}
     * 
     * @memberOf ClientDaoMongoose
     */
    getClientByClientIdAndSecret(clientId: string, clientSecret: string): Q.Promise<any> {
        log.debug("getClientByClientIdAndSecret: ", clientId);
        let deferred : Q.Deferred<any> = Q.defer(); 
        this.ClientModel.findOne({ clientId: clientId, clientSecret: clientSecret, $or : [ { deleted : false }, { deleted : null } ] }, (error: any, client: Client) => {
            if(error) {
                deferred.reject(error);
            } else {
                deferred.resolve(client);
            }
        });
        return deferred.promise;
    }

    /**
     * Update client by id
     * 
     * @param {string} id
     * @param {Object} updatedClient
     * @returns {Q.Promise<any>}
     * 
     * @memberOf ClientDaoMongoose
     */
    updateClientById(id: string, updatedClient: Object): Q.Promise<any> {
		log.debug("updateClientById: id : " + id);
        let deferred : Q.Deferred<any> = Q.defer(); 
        this.ClientModel.findOneAndUpdate( { _id : id.toString(), $or : [ { deleted : false }, { deleted : null } ] }, { $set: updatedClient }, { new: true },
			function (err: any, client: Client) {
				if (err) {
					deferred.reject(err);
				} else if (client) {
					deferred.resolve(client);
				} else {
					deferred.reject(new Error("No client with this id"));
				}
			}
		);
        return deferred.promise;
	}

    /**
     * Get client by criteria
     * 
     * @param {*} criteria
     * @returns {Q.Promise<any>}
     * 
     * @memberOf ClientDaoMongoose
     */
    getClient(criteria: any): Q.Promise<any> {
        log.debug("getClient :  " + JSON.stringify(criteria));
        let deferred : Q.Deferred<any> = Q.defer(); 
        var tmpCriteria : any = {} ;
        if(criteria === null || criteria === undefined || criteria === '') {
            tmpCriteria = {};
        } else {
            tmpCriteria = JSON.parse(criteria as string);
        }
        tmpCriteria["$or"] = [ { deleted : false }, { deleted : null } ]
        criteria = JSON.stringify(tmpCriteria);
        log.debug("getClient criteria :  " + JSON.stringify(criteria));
        this.ClientModel.findOne(criteria, function(err:any, client:Client){
            if (err) {
                deferred.reject(err);
            } else if (client) {
                deferred.resolve(client);
            } else {
                deferred.reject(new Error("No client with this id"));
            }
        });
        return deferred.promise;
    }

    /**
     * Get client by id
     * 
     * @param {string} id
     * @returns {Q.Promise<any>}
     * 
     * @memberOf ClientDaoMongoose
     */
    getClientById(id: string): Q.Promise<any> {
        log.debug("getClientById :  " + JSON.stringify(id));
        let deferred : Q.Deferred<any> = Q.defer(); 
        this.ClientModel.findOne({ _id : id, $or : [ { deleted : false }, { deleted : null } ]}, function(err:any, client:Client){
            if (err) {
                deferred.reject(err);
            } else if (client) {
                deferred.resolve(client);
            } else {
                deferred.reject(new Error("No client with this id"));
            }
        });
        return deferred.promise;
    }

    /**
     * Remove client by id
     * 
     * @param {string} id
     * @returns {Q.Promise<any>}
     * 
     * @memberOf ClientDaoMongoose
     */
    removeClient(id:string): Q.Promise<any> {
        log.debug("removeClient :  " + JSON.stringify(id));
        return this.updateClientById(id, { deleted : true });
    }
}