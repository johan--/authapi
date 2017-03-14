'use strict'

import { Request } from 'express';
import * as Q from 'q';

/**
 * @export
 * @interface ITokenManager
 */
export interface ITokenManager {
	secret : string;
	generateRandomToken() : Q.Promise<string>;
	createJwtToken(data : any, secretKey : string) : Q.Promise<string> ;
	decodeJwtToken(token: string, secretKey : string, verifyToken : boolean) : Q.Promise<string>;
	authenticateJwtToken(username: string, token: string, secretKey : string) : Q.Promise<boolean>;
}