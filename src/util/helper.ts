'use strict'
import express = require('express');
import { Request, Response } from "express";
import crypto = require("crypto");
import { Logger } from './logger';

const log = new Logger('util/helper');

export class Helper {
    /**
     * validates password format
     * 
     * @static
     * @param {String} password
     * @returns {Boolean}
     * 
     * @memberOf Helper
     */
    static validatePassword(password: string) : boolean {
        var exp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[$"?@$!%*#_ +=|~?&()/.,<>`,[\]^"';\\:{}\-]).{8,}$/;
        let isPasswordValid: boolean = exp.test(password.toString());
        return isPasswordValid;
    }

    /**
     * creates client secret key
     * 
     * @static
     * @param {string} clientId
     * @param {string} name
     * @returns {string}
     * 
     * @memberOf Helper
     */
    static generateClientSecret(clientId: string, name: string) : string{
		let sha256 = crypto.createHash('sha256');
		sha256.update(clientId);
		sha256.update(name);
		sha256.update(Math.random() + '');
		let clientSecret: string= sha256.digest('hex');
        log.debug("Client secret generated successfully.")
		return clientSecret;
	}

    /**
     * generates the clientId
     * 
     * @static
     * @param {string} name
     * @returns {string}
     * 
     * @memberOf Helper
     */
    static generateClientId(name: string): string{
		let sha256 = crypto.createHash('sha256');
		sha256.update(name);
		sha256.update(Math.random() + '');
		let clientId= sha256.digest('hex');
        log.debug("Client Id generated successfully.")
		return clientId;
	}

    /**
     * fetches user client information
     * 
     * @static
     * @param {Request} req
     * @returns {String}
     * 
     * @memberOf Helper
     */
    static getUserClientInfo(req: Request): string {
        // Get user ip
        var clientInfo = {
            agent: req.headers['user-agent'], // User Agent we get from headers
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress // Get IP - allow for proxy
        };
        log.debug("client user info fetched.")
        return encodeURI(JSON.stringify(clientInfo));
    }

    /**
     * get new expiration time
     * 
     * @static
     * @returns {Number}
     * 
     * @memberOf Helper
     */
    static getNewExpirationTime() : number {
        return new Date().getTime()+1800000;
    }

    static isEmailValid(email: string) : Boolean {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    static parseQueryParameters(req : Request)  {

    }
}