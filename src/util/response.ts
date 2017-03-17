'use strict'

import { Request, Response } from "express";
import { Logger } from '../util/logger';

const log = new Logger('AppResponse');

let responseWrapper = require("api-response");
let ApiResponse = responseWrapper.apiResponse;
let MetaData = responseWrapper.metadata;
let defaultWarnHttpStatusCode : number = 404;

export class AppResponse {
    /**
     * 
     * 
     * @static
     * @param {Response} response
     * @param {*} responseData
     * 
     * @memberOf AppResponse
     */
    static created(response: Response, responseData: any) {
        log.debug("created : Success response with code 201");
        response.status(201).send(new ApiResponse(new MetaData("success", null), responseData));
    }
    
    /**
     * 
     * 
     * @static
     * @param {Response} response
     * @param {*} responseData
     * 
     * @memberOf AppResponse
     */
    static success(response: Response, responseData: any) {
        log.debug("success : Success response with code 200");
        response.status(200).send(new ApiResponse(new MetaData("success", null), responseData));
    }

    /**
     * 
     * 
     * @static
     * @param {Response} response
     * @param {*} responseData
     * 
     * @memberOf AppResponse
     */
    static warn(response: Response, responseData: any) {
        log.debug("warn");
        AppResponse.handleResponseForResponseData(response, responseData);
    }

    /**
     * 
     * 
     * @static
     * @param {Response} response
     * @param {Error} err
     * @param {*} [responseData]
     * 
     * @memberOf AppResponse
     */
    static failure(response: Response, err: Error, responseData?: any) {
        log.debug("failure");
        if(err) { log.error(err.message, err); }
        AppResponse.handleResponseForResponseData(response, responseData ? responseData : err);
    }

    /**
     * 
     * 
     * @private
     * @static
     * @param {Response} response
     * @param {*} responseData
     * 
     * @memberOf AppResponse
     */
    private static handleResponseForResponseData(response: Response, responseData : any) {
        log.debug("handleResponseForResponseData");
        if(responseData instanceof Error) {
            log.error(responseData.message, responseData);
            response.status(500).send(new ApiResponse(new MetaData("failure", responseData.message), null));
        } else if(responseData.key) {
            AppResponse.handleKeyValuePairResponse(response, responseData);
        } else if(responseData.callbackURL) {
            log.debug("Redirected to : " + responseData.callbackURL);
            response.redirect(responseData.callbackURL);
        } else {
            log.debug("Failure response with code " + defaultWarnHttpStatusCode + ", resp data : " + JSON.stringify(responseData));
            response.status(defaultWarnHttpStatusCode).send(new ApiResponse(new MetaData("failure", null), responseData));
        }
    }

    /**
     * 
     * 
     * @private
     * @static
     * @param {Response} response
     * @param {*} responseData
     * 
     * @memberOf AppResponse
     */
    private static handleKeyValuePairResponse(response: Response, responseData : any) {
        log.debug("handleKeyValuePairResponse");
        let status = defaultWarnHttpStatusCode;
        if(responseData.status) {
            status = responseData.status;
            delete responseData.status;
        }
        log.debug("Failure response with code " + status + ", resp data : " + JSON.stringify(responseData));
        response.status(status).send(new ApiResponse(new MetaData("failure", responseData), null));
    }
}