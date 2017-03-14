'use strict'
import { ITokenManager } from "./interface/tokenmanager";
import { JWTManager } from "./impl/jwt/jwt";

export enum TokenManagerName { JWT }

export class TokenFactory {
    /**
     * get token manager
     * 
     * @static
     * @param {TokenManagerName} name
     * @returns {ITokenManager}
     * 
     * @memberOf TokenFactory
     */
    public static getTokenManager(name : TokenManagerName) : ITokenManager {
        switch (name) {
            case TokenManagerName.JWT:
                return new JWTManager();
            default:
                return null;
        }
    }
}