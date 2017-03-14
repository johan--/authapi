'use strict'

import * as Q from 'q';
import { Client } from "../../../model/entity/client";

/**
 * @export
 * @interface IClientService
 */
export interface IClientService {
    addClient(username : string, appName : string, redirectURIS : Array<string>): Q.Promise<Client>;
    removeClient(id: string): Q.Promise<any>;
    getClientsByUsername(username : string): Q.Promise<Array<Client>>;
    updateClientById(id: string, updatedInformation: any): Q.Promise<Client>;
    resetClientSecretById(id: string): Q.Promise<Client>;
}