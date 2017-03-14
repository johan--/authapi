'use strict'

import { Request, Response } from "express";

export interface IUserController {
	self(request: Request, reponse: Response): void;
	listUser(searchCriteria: any, request: Request, reponse: Response): void;
	getUserById(id: string, request: Request, response: Response): void;
	updateUser(id: string, updatedInformation: any, request: Request, response: Response): void;
	removeUser(id: string, request: Request, response: Response): void;
}