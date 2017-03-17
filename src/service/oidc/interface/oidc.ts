'use strict'

import * as Q from 'q';
import { Client } from "../../../model/entity/client";
import { AuthorizeRequestData } from "../../../model/entity/authorize-request-data";

/**
 * 
 * 
 * @export
 * @interface IOIDCService
 */
export interface IOIDCService {
    processAuthorizeRequest (authorizeRequest : AuthorizeRequestData) : Q.Promise<AuthorizeRequestData>;
    consent(authorizeRequest : AuthorizeRequestData, accept : string) : Q.Promise<AuthorizeRequestData>;
    token(grantType : string, code : string, clientId : string, clientSecret : string, redirectURL : string, ipaddress : string) : Q.Promise<any>;
}

export class AuthRequestWorkFlow {

    /**
     * 
     * 
     * @type {boolean}
     * @memberOf AuthRequestWorkFlow
     */

    generateCode : boolean;
    
    /**
     * 
     * Would Skip Next Promise Callbacks And Go To The End
     * @type {boolean}
     * @memberOf AuthRequestWorkFlow
     */
    skipNextSteps : boolean;
    
    /**
     * 
     * 
     * @type {boolean}
     * @memberOf AuthRequestWorkFlow
     */
    isWhiteListed : boolean;


    /**
     * 
     * 
     * @type {AuthorizeRequestData}
     * @memberOf AuthRequestWorkFlow
     */


    
    /**
     * 
     * 
     * @type {AuthorizeRequestData}
     * @memberOf AuthRequestWorkFlow
     */
    authorizeRequestData : AuthorizeRequestData;
    /**
     * 
     * 
     * @type {{[key : string]:string}}
     * @memberOf AuthRequestWorkFlow
     */
    errorParams : {[key : string]:string};
    /**
     * 
     * 
     * @type {boolean}
     * @memberOf AuthRequestWorkFlow
     */
    isErrorState : boolean;
    /**
     * 
     * 
     * @type {number}
     * @memberOf AuthRequestWorkFlow
     */
    httpErrorCode : number;
    /**
     * 
     * 
     * @type {Client}
     * @memberOf AuthRequestWorkFlow
     */
     client : Client;
    /**
     * Creates an instance of AuthRequestWorkFlow.
     * 
     * 
     * @memberOf AuthRequestWorkFlow
     */
    constructor(authorizeRequestData : AuthorizeRequestData) {
        this.authorizeRequestData = authorizeRequestData;
    }
}