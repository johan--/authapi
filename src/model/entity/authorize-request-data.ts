'use strict'

import { Scope } from "./scope";
import { User } from "./user";
import { Consent } from "./consent";
import { AuthorizationCode } from "./authcode";

/**
 * 
 * 
 * @export
 * @class RequestData
 */
export class AuthorizeRequestData {
    isWorkFlowCompleted : boolean;
    clientId : string;
    redirectURI : string;
    state : string;
    responseType : string;
    scope : {[key : string]: Scope; };
    isUserLoggedIn : boolean;
    goto : string;
    user : User;
    consent : Consent;
    authorizeCode : AuthorizationCode;
    
    /**
     * Creates an instance of AuthorizeRequestData.
     * 
     * @param {string} clientId
     * @param {string} redirectURI
     * @param {string} state
     * @param {string} responseType
     * @param {{[key : string]: Scope; }} scope
     * 
     * @memberOf AuthorizeRequestData
     */
    constructor(clientId : string, redirectURI : string, responseType : string, scope : {[key : string]: Scope; }, state? : string) {
        this.isWorkFlowCompleted = false;
        this.clientId = clientId;
        this.redirectURI = redirectURI;
        this.state = state;
        this.responseType = responseType;
        this.scope = scope;
    }

    /**
     * 
     * Throws An Error If The Parameters Are missing.
     * 
     * @returns {void}
     * 
     * @memberOf AuthorizeRequestData
     */
    checkForMandatoryParameters() : void {
        let missingParams : Array<string> = [];
        if(this.isNullOrEmpty(this.clientId)) { missingParams.push("client_id"); }
        if(this.isNullOrEmpty(this.redirectURI)) { missingParams.push("redirect_uri"); }
        if(this.isNullOrEmpty(this.responseType)) { missingParams.push("response_type"); }
        /**
         * I think we need to discuss this based on the spec that we are implementing
         * We are not really convinced that this should be mandatory.
         */
        if(this.isNullOrEmpty(this.scope)) { missingParams.push("scope"); }
        if(missingParams && missingParams.length > 0) {
            throw missingParams;
        }
    }

    /**
     * 
     * 
     * 
     * @memberOf AuthorizeRequestData
     */
    checkForClientId() : void {
        let missingParams : Array<string> = [];
        if(this.isNullOrEmpty(this.clientId)) { missingParams.push("client_id"); }
        if(missingParams && missingParams.length > 0) {
            throw missingParams;
        }
    }

    /**
     * 
     * 
     * @param {boolean} isUserLoggedIn
     * 
     * @memberOf AuthorizeRequestData
     */
    setIsUserLoggedIn(isUserLoggedIn : boolean) {
        this.isUserLoggedIn = isUserLoggedIn;
    }

    /**
     * 
     * 
     * @returns {string}
     * 
     * @memberOf AuthorizeRequestData
     */
    getQueryString() : string {
        let returnQueryStr : string = "";
        if(this.authorizeCode) {
            this.isWorkFlowCompleted = true;
            returnQueryStr += "?code=" + this.authorizeCode.code;
            if(this.state) {
                returnQueryStr += "&state=" + this.state;
            }
        }
        return returnQueryStr;
    }

    /**
     * 
     * 
     * @private
     * @param {*} value
     * @returns
     * 
     * @memberOf AuthorizeRequestData
     */
    private isNullOrEmpty(value : any) {
        let isNullOrEmpty = false;
        if(value === null || value === undefined) {
            isNullOrEmpty = true;
        }
        return isNullOrEmpty;
    }
}