'use strict'

import { IClientController } from "../interface/client";
import { Request, Response } from "express";
import { IClientService } from "../../service/client/interface/client";
import { Client } from "../../model/entity/client";
import { Helper } from "../../util/helper";
import { AppResponse } from "../../util/response";
import { DaoFactory } from "../../model/dao/factory";
import { Logger } from '../../util/logger';
import { SessionManager, SessionKeys } from '../../util/Session';

const log = new Logger('ClientController');

export class ClientController implements IClientController {

	clientService: IClientService;

	constructor(clientService: IClientService) {
		this.clientService = clientService;
	}

	/**
	 * 
	 * 
	 * @param {Request} request
	 * @param {Response} response
	 * 
	 * @memberOf ClientController
	 */
	addClient(request: Request, response: Response): void {
		log.debug("addClient");
		SessionManager.get(request, SessionKeys.User_Details)
		.then((userDetails : any) => {
			if (userDetails["username"]) {
				let username : string = userDetails["username"];
				let appName : string = request.body.appName;
				let redirectURIs : Array<string> = request.body.redirect_uris;
				log.debug("username : " + username + ", appName : " + appName + ", redirectURIs : " + JSON.stringify(redirectURIs));
				this.clientService.addClient(username, appName, redirectURIs)
				.then((client : Client) => { AppResponse.success(response, client); })
				.fail((err : Error) => { AppResponse.failure(response, err); })
        		.done();
			} else {
				AppResponse.warn(response, { status : 401, key: "SESSION_ERROR", value: "Your session is expired. Please login before adding client app." })
			}
		})
		.fail((err : Error) => { AppResponse.failure(response, err); })
        .done();
	}

	/**
	 * 
	 * 
	 * @param {string} id
	 * @param {Request} request
	 * @param {Response} response
	 * 
	 * @memberOf ClientController
	 */
	removeClient(id: string, request: Request, response: Response): void {
		log.debug("removeClient");
		SessionManager.get(request, SessionKeys.User_Details)
		.then((userDetails : any) => {
			if (userDetails["username"]) {
				this.clientService.removeClient(id)
				.then((client : any) => { AppResponse.success(response, client); })
				.fail((err : Error) => { AppResponse.failure(response, err); })
        		.done();
			} else {
				AppResponse.warn(response, { status : 401, key: "SESSION_ERROR", value: "Your session is expired. Please login before removing client app." })
			}
		})
		.fail((err : Error) => { AppResponse.failure(response, err); })
        .done();
	}

	/**
	 * 
	 * 
	 * @param {Request} request
	 * @param {Response} response
	 * 
	 * @memberOf ClientController
	 */
    getClientsByUsername(request: Request, response: Response): void {
		log.debug("getClientsByUsername");
		SessionManager.get(request, SessionKeys.User_Details)
		.then((userDetails : any) => {
			if (userDetails["username"]) {
				let username : string = userDetails["username"];
				this.clientService.getClientsByUsername(username)
				.then((clients : Array<Client>) => { AppResponse.success(response, clients); })
				.fail((err : Error) => { AppResponse.failure(response, err); })
        		.done();
			} else {
				AppResponse.warn(response, { status : 401, key: "SESSION_ERROR", value: "Your session is expired. Please login again." })
			}
		})
		.fail((err : Error) => { AppResponse.failure(response, err); })
        .done();
	}

	/**
	 * 
	 * 
	 * @param {string} id
	 * @param {*} updatedInformation
	 * @param {Request} request
	 * @param {Response} response
	 * 
	 * @memberOf ClientController
	 */
	updateClientById(id: string, updatedInformation: any, request: Request, response: Response): void {
		log.debug("updateClientById");
		SessionManager.get(request, SessionKeys.User_Details)
		.then((userDetails : any) => {
			if (userDetails["username"]) {
				this.clientService.updateClientById(id, updatedInformation)
				.then((client : Client) => { AppResponse.success(response, client); })
				.fail((err : Error) => { AppResponse.failure(response, err); })
        		.done();
			} else {
				AppResponse.warn(response, { status : 401, key: "SESSION_ERROR", value: "Your session is expired. Please login again." })
			}
		})
		.fail((err : Error) => { AppResponse.failure(response, err); })
        .done();
	}

	/**
	 * 
	 * 
	 * @param {string} id
	 * @param {Request} request
	 * @param {Response} response
	 * 
	 * @memberOf ClientController
	 */
	resetClientSecretById(id: string, request: Request, response: Response): void {
		log.debug("updateClientById");
		SessionManager.get(request, SessionKeys.User_Details)
		.then((userDetails : any) => {
			if (userDetails["username"]) {
				this.clientService.resetClientSecretById(id)
				.then((client : Client) => { AppResponse.success(response, client); })
				.fail((err : Error) => { AppResponse.failure(response, err); })
        		.done();
			} else {
				AppResponse.warn(response, { status : 401, key: "SESSION_ERROR", value: "Your session is expired. Please login again." })
			}
		})
		.fail((err : Error) => { AppResponse.failure(response, err); })
        .done();
	}

	/**
	 * 
	 * 
	 * @param {Request} req
	 * @param {Response} res
	 * @param {Function} next
	 * 
	 * @memberOf SimpleClientController
	 */
	checkUserSession(req : Request, res : Response, next : Function) : void {
		//TODO Check If The User Is in Session And Then Only Proceed
	}
}