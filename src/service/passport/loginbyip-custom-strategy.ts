'use strict'
import * as Q from "q";
import { Request, Response } from "express";
import { DaoFactory } from "../../model/dao/factory";
import { IDaoFactory } from "../../model/dao/iDaoFactory";
import { IUserDao } from "../../model/dao/interface/user-dao";
import { IClientDao } from "../../model/dao/interface/client-dao";
import { IpStrategy } from "./ip-strategy";
import { IProfileTransform } from "../../profile-transform/interface/profile-transform";
import { ProfileTransformFactory, ProfileName } from "../../profile-transform/factory";
import { Client } from "../../model/entity/client";
import { User } from "../../model/entity/user";
import { Logger } from '../../util/logger';
import { Helper } from '../../util/helper';
import ApplicationConfig = require("../../config/application-config");

var ajaxRequest = require('request');
var querystring = require('querystring');
let CustomStrategy = require("passport-custom").Strategy;

const log = new Logger('loginByIp-custom-strategy');

export class LoginByIpCustomStrategy {

    passport : any;
    userDao : IUserDao;
    clientDao : IClientDao;
    ipStrategy : IpStrategy;

    constructor(passportInstance: any, daoFactory: IDaoFactory) {

        this.passport = passportInstance;
        this.userDao = daoFactory.getUserDao();
        this.clientDao = daoFactory.getClientDao();
        this.ipStrategy = new IpStrategy(daoFactory);
        this.createLoginByIpCustomStrategy();
    }

    /**
     * 
     * 
     * @private
     * 
     * @memberOf LoginByIpCustomStrategy
     */
    private createLoginByIpCustomStrategy() : void {
        log.debug("initializing Ip Custom Strategy");
        let self = this;
        this.passport.use('ip-custom', new CustomStrategy(
            function (request: Request, done: any) {
                let ipaddress = request.headers['clientip'] || "";
                let clientId: string = request.headers['client_id'];
                let clientSecret = request.headers['client_secret'];
                log.debug("clientId: ", clientId);
                let isError = false;

                self.clientDao.getClientByClientId(clientId)
                .then((client : Client) => {
                    if(client) {
                        if(client.clientSecret === clientSecret){
                            log.debug("verified client");
                            return self.getOrganizationDetails(ipaddress);
                        }
                        else {
                            log.debug("Client Secret is not verified");
                            done(new Error("clientSecret is not match."), null);
                            isError = true;
                        }
                    } else {
                        log.debug("Client not found.");
                        done(new Error("Client not found."), null);
                        isError = true;
                    }
                })
                .then((result : any) => { if (!isError) { return self.onLoginByIpResponse(ipaddress, result.res, result.body); } })
                .then((user : User) => { if (!isError) { done(null, user); } })
                .fail((err : Error) => { done(err, null); })
                .done();
            }
        ));
    }

    /**
     * 
     * 
     * @param {string} ipaddress
     * @returns {Q.Promise<any>}
     * 
     * @memberOf LoginByIpCustomStrategy
     */
    getOrganizationDetails(ipaddress: string) : Q.Promise<any> {
        log.debug("getOrganizationDetails : ip : " + ipaddress);
        let deferred : Q.Deferred<any> = Q.defer();
        ajaxRequest(
            {
                url: ApplicationConfig.IPMGMT_CONFIG.ipAuthApiUrl,
                method: 'GET',
                rejectUnauthorized: false,
                headers: {
                    "Content-Type": "application/json",
                    "clientip": ipaddress
                }
            },
            function (err: any, res: Response, body: HTMLBodyElement) {
                log.debug("getOrganizationDetails : On get IP details Call : ", { Error : err, Body :  body });
                if(err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve({ res : res, body : body });
                }
            }
        );
        return deferred.promise;
    }

    /**
     * 
     * 
     * @private
     * @param {String} ipaddress
     * @param {Response} res
     * @param {HTMLBodyElement} body
     * @returns {Q.Promise<any>}
     * 
     * @memberOf LoginByIpCustomStrategy
     */
    private onLoginByIpResponse(ipaddress: String, res: Response, body: HTMLBodyElement) : Q.Promise<any> {
        log.debug("onLoginByIpResponse : ip : " + ipaddress);
        let deferred : Q.Deferred<any> = Q.defer();
        let jsonResponse = JSON.parse(body.toString());
        if (res.statusCode == 200) {
            if (jsonResponse.data.access_type === "allow" && jsonResponse.data.create_token) {
                let profileTransform : IProfileTransform = ProfileTransformFactory.getProfileTransformUtil(ProfileName.IP);
                let profileData : any = { ipAddress : ipaddress, ipDetails : body };
                let user : User = profileTransform.createUserFromProfile(profileData);

                this.ipStrategy.registerOrLoginIpUser(user)
                .then((userDetails : User) => { deferred.resolve(userDetails); })
                .fail((err : Error) => { deferred.reject(err); })
                .done();
            }
            else if (!jsonResponse.data.create_token && jsonResponse.data.access_type === "allow" ) {
                deferred.resolve();
            }
            else {
                deferred.reject(new Error("Access denied for ip: " + ipaddress));
            }
        } else {
            deferred.reject(new Error("Unable to get details. Status Code : " + res.statusCode));
        }
        return deferred.promise;
    }
}