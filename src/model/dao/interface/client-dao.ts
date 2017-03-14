'use strict'
import { Client } from "../../entity/client";
import * as Q from 'q';

/**
 * @export
 * @interface IClientDao
 */
export interface IClientDao {
    addClient(client : Client) : Q.Promise<any>;
    getClientByClientId(clientId : string) : Q.Promise<any>;
    getClientsByUsername(username : string) : Q.Promise<any>;
    getClientByClientIdAndSecret(clientId : string, clientSecret : string) : Q.Promise<any>;
    updateClientById(id : string, updatedData : Object) : Q.Promise<any>;
    getClient(criteria : string) : Q.Promise<any>;
    getClientById(id : string) : Q.Promise<any>;
    removeClient(id : string) : Q.Promise<any>;
}