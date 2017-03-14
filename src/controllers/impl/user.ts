'use strict'

import { IUserController } from "../interface/user";
import { Request, Response } from "express";
import { IUserService } from "../../service/user/interface/user";
import { User } from "../../model/entity/user";
import { Helper } from "../../util/helper";
import { AppResponse } from "../../util/response";
import { DaoFactory } from "../../model/dao/factory";
import { Logger } from '../../util/logger';
import { SessionManager, SessionKeys } from '../../util/session';

const log = new Logger('UserController');

export class UserController implements IUserController {

	userService: IUserService;

	constructor(userService: IUserService) {
		this.userService = userService;
	}

	self(request: Request, response: Response): void {
		SessionManager.get(request, SessionKeys.User_Details)
		.then((user : User) => {
			if(user) {
				AppResponse.success(response, user);
			} else {
				AppResponse.warn(response, "No user found.");
			}
		})
		.fail((err : Error) => { AppResponse.failure(response, err); })
        .done();
	}

	/**
	 * 
	 * 
	 * @param {*} searchCriteria
	 * @param {Request} request
	 * @param {Response} response
	 * 
	 * @memberOf SimpleUserController
	 */
	listUser(searchCriteria: any, request: Request, response: Response): void {
		log.debug("listUser");
		this.userService.listUser()
		.then((users : Array<User>) => { AppResponse.success(response, users); })
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
	 * @memberOf SimpleUserController
	 */
	getUserById(id: string, request: Request, response: Response): void {
		log.debug("getUserById");
		this.userService.getUserById(id)
		.then((user : User) => { AppResponse.success(response, user); })
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
	 * @memberOf SimpleUserController
	 */
	updateUser(id: string, updatedInformation: any, request: Request, response: Response): void {
		log.debug("updateUser");
		this.userService.updateUser(id, updatedInformation)
		.then((user : User) => { AppResponse.success(response, user); })
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
	 * @memberOf SimpleUserController
	 */
	removeUser(id: string, request: Request, response: Response): void {
		log.debug("removeUser");
		this.userService.removeUser(id)
		.then((user : User) => { AppResponse.success(response, user); })
		.fail((err : Error) => { AppResponse.failure(response, err); })
        .done();
	}
}