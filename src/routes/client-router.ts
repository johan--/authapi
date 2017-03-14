'use strict'
import * as express from "express";
import { Request, Response, Router } from "express";
import { IClientController } from "../controllers/interface/client";
import { SessionManager, SessionKeys } from "../util/session";

let router: Router = express.Router();
let clientController: IClientController;

export class ClientRouter {

    public getRouter(): Router {
        return router;
    }

    constructor(clientControllerInstance : IClientController) {
        clientController = clientControllerInstance;
		this.init();
	}

	private init() {
		
        router.get("/",function (request: Request, response: Response){
            response.render("appRegister");
        });

        /**
         * @swagger
         * "/client/":    
         *      post:
         *        tags:
         *        - Client-Routers
         *        description: for registering an app under a client as well  to generate client_id and client_secret
         *        operationId: for the URL
         *        produces:
         *        - application/json
         *        parameters:
         *        - name: Parameters
         *          in: body
         *          description: Parameters to register an api
         *          required: true
         *          schema:
         *            "$ref": "#/definitions/clientCreate"
         *        responses:
         *          '200':
         *            description: create response         
         */

        router.post("/",function (request: Request, response: Response){
            clientController.addClient(request, response);
        });
/**
         * @swagger
         * "/client/{id}":
         *  put:
         *    tags:
         *    - Client-Routers
         *    description: for updating client by id 
         *    operationId: for the URL
         *    produces:
         *    - application/json
         *    parameters:
         *    - name: job parameters
         *      in: body
         *      description: Parameters to get updated
         *      required: true
         *      schema:
         *        "$ref": "#/definitions/updateClientCreate"
         *    - name: id
         *      in: path
         *      description: _id of the client
         *      type: string
         *      required: true
         *    responses:
         *      '200':
         *        description: create response
         *  delete:
         *     tags:
         *     - Client-Routers
         *     description: for deleting client by id
         *     operationId: for the URL
         *     produces:
         *     - application/json
         *     parameters:
         *     - name: id
         *       in: path
         *       description: _id of the client
         *       type: string
         *       required: true
         *     responses:
         *       '200':
         *          description: create response 
         */
        router.delete("/:id",function (request: Request, response: Response){
            clientController.removeClient(request.params.id, request, response);
        });

        router.put("/:id",function (request: Request, response: Response){
            clientController.updateClientById(request.params.id, request.body, request, response);
        });
        
        /**
         * @swagger
         * "/client/resetSecret/{id}":
         *   put:
         *    tags:
         *    - Client-Routers
         *    description: to reset client-secret
         *    operationId: for the URL
         *    produces:
         *    - application/json
         *    parameters:
         *    - name: id
         *      in: path
         *      description: _id of the client
         *      type: string
         *      required: true
         *    responses:
         *      '200':
         *        description: searched user         
         */
        
        router.put("/resetSecret/:id",function (request: Request, response: Response){
            clientController.resetClientSecretById(request.params.id, request, response);
        });

        /**
         * @swagger
         * "/client/list":
         *   get:
         *    tags:
         *    - Client-Routers
         *    description: to list all the apis registered for a client
         *    operationId: for the URL
         *    produces:
         *    - application/json
         *    responses:
         *      '200':
         *        description: create response
         *        schema:
         *          "$ref": "#/definitions/create"
         */

        router.get("/list",function (request: Request, response: Response){
            clientController.getClientsByUsername(request, response);
        });
        
        
        router.use((req : Request, res : Response, next : Function) : void => {
            clientController.checkUserSession(req , res , next );
        });
    }
}