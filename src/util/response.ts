'use strict'
import { Request, Response } from "express";

let responseWrapper = require("api-response");
let ApiResponse = responseWrapper.apiResponse;
let MetaData = responseWrapper.metadata;

export class AppResponse {
    
    static success(response: Response, responseData: any) {
        response.status(200).send(new ApiResponse(new MetaData("success", null), responseData));
    }

    static warn(response: Response, responseData?: any) {
        if (responseData) {
            log.error("error : " + responseData.stack);
            response.status(500).send(new ApiResponse(new MetaData("failure", responseData.message), null));
        } else {
            response.status(200).send(new ApiResponse(new MetaData("success", null), responseData));
        }
    }

    static failure(response: Response, err: Error, responseData?: any) {
        if (err) {
            log.error("error : " + err.stack);
            response.status(500).send(new ApiResponse(new MetaData("failure", err.message), null));
        } else {
            response.status(200).send(new ApiResponse(new MetaData("success", null), responseData));
        }
    }
}