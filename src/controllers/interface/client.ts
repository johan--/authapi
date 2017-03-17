'use strict'

import {Request, Response} from "express";

export interface IClientController {
    /**
     * 
     * 
     * @param {Request} request
     * @param {Response} response
     * 
     * @memberOf IClientController
     */
	addClient(request: Request, response: Response): void;
   
    /**
     * 
     * 
     * @param {string} id
     * @param {Request} request
     * @param {Response} response
     * 
     * @memberOf IClientController
     */
    removeClient(id: string, request: Request, response: Response): void;

    /**
     * 
     * 
     * @param {Request} request
     * @param {Response} response
     * 
     * @memberOf IClientController
     */
    getClientsByUsername(request: Request, response: Response): void;

    /**
     * 
     * 
     * @param {string} id
     * @param {*} client
     * @param {Request} request
     * @param {Response} response
     * 
     * @memberOf IClientController
     */
    updateClientById(id: string, client:any, request: Request, response: Response): void;

    /**
     * 
     * 
     * @param {string} id
     * @param {Request} request
     * @param {Response} response
     * 
     * @memberOf IClientController
     */
    resetClientSecretById(id: string, request: Request, response: Response): void;
}