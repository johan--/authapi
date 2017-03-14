'use strict'
import * as express from "express";
import { Request, Response, Router } from "express";
import { IUserController } from "../controllers/interface/user";
import { SessionManager, SessionKeys } from "../util/session";

let userController: IUserController;
let router: Router = express.Router();

export class UserRouter {

	constructor(userControllerInstance: IUserController) {
		userController = userControllerInstance;
		this.init();
	}

	private init() {

		/**
		 * @swagger
		 * "/user/list":
		 *  get:
		 *    tags:
		 *    - User-Routers
		 *    description: for listing users(now only one)
		 *    operationId: for the URL
		 *    produces:
		 *    - application/json
		 *    responses:
		 *      '200':
		 *        description: create response		 
		 */

		router.get("/", function (request: Request, response: Response) {
			userController.listUser(null, request, response);
		});

		/**
		 * @swagger
		 * "/user/self":
		 *  get:
		 *    tags:
		 *    - User-Routers
		 *    description: Get user orcid profile information with header authtoken
		 *    operationId: for the URL
		 *    produces:
		 *    - application/json
		 *    responses:
		 *      '200':
		 *        description: create response		 
		 */
		

		
		router.get("/self", function (request: Request, response: Response) {
			userController.self(request, response);
		});


        /**
		 * @swagger
		 * "/user/{id}":
		 *  get:
		 *    tags:
		 *    - User-Routers
		 *    description: for listing user whose id is passed as path parameter
		 *    operationId: for the URL
		 *    produces:
		 *    - application/json
		 *    parameters:
		 *    - name: id
		 *      in: path
		 *      description: _id of an authenticated user
		 *      required: true
		 *      type: string
		 *    responses:
		 *      '200':
		 *        description: create response		 
		 *  put:
		 *    tags:
		 *    - User-Routers
		 *    description: for updating credentials of an authenticated user
		 *    operationId: for the URL
		 *    produces:
		 *    - application/json
		 *    parameters:
		 *    - name: id
		 *      in: path
		 *      description: _id of an authenticated user
		 *      required: true
		 *      type: string
		 *    - name: body parameters for updating
		 *      in: body
		 *      description: Parameters to update(username,credential,accesstoken cant be upadated)
		 *      required: false
		 *      schema:
		 *        "$ref": "#/definitions/userUpdateCreate"
		 *    responses:
		 *      '200':
		 *        description: create response		 
		 *  delete:
		 *    tags:
		 *    - User-Routers
		 *    description: for deleting an authenticated user
		 *    operationId: for the URL
		 *    produces:
		 *    - application/json
		 *    parameters:
		 *    - name: id
		 *      in: path
		 *      description: _id of authenticated user
		 *      required: true
		 *      type: string
		 *    responses:
		 *      '200':
		 *        description: create response		 
		 */

		router.get("/:id", function (request: Request, response: Response) {
			if (request.params.id !== null || request.params.id !== '') {
				userController.getUserById(request.params.id, request, response);
			}
		});
		
		router.put("/:id", function (request: Request, response: Response) {
			userController.updateUser(request.params.id, request.body, request, response);
		});

		router.delete("/:id", function (request: Request, response: Response) {
			userController.removeUser(request.params.id, request, response);
		});
	}

	public getRouter(): Router {
        return router;
    }
}