'use strict'
/**
 * 
 * 
 * @export
 * @class Scope
 */
export class Scope {
    name : string;
    description : string;
    static defaultScopes : {[key : string]: Scope; }

    /**
     * 
     * 
     * @static
     * 
     * @memberOf Scope
     */
    static intializeScopes () {
        Scope.defaultScopes = {};
        Scope.defaultScopes["mail"] = new Scope("mail", "Access To Your Email");
        Scope.defaultScopes["username"] = new Scope("username", "Access To Your username");
    }

    /**
     * Creates an instance of Scope.
     * 
     * @param {string} name
     * @param {string} description
     * 
     * @memberOf Scope
     */
    constructor(name : string, description : string) {
        this.name = name;
        this.description = description;
    }

    /**
     * 
     * 
     * @static
     * @param {string} scopeString
     * @returns {{[key : string]: Scope; }}
     * 
     * @memberOf Scope
     */
    static getScopesFromAuthorizationString(scopeString : string) : {[key : string]: Scope; } {
        let scopes : {[key : string]: Scope; } = {};
        if(scopeString && scopeString.length > 0) {
            let scopeKeys : Array<string> = scopeString.split(" ");
            for(var index in scopeKeys) {
                let scopeKey = scopeKeys[index];
                if(Scope.arrayContains(Object.keys(Scope.defaultScopes), scopeKey)) {
                    scopes[scopeKey] = Scope.defaultScopes[scopeKey];
                }
            }
        }
        return scopes;
    } 

    /**
     * 
     * 
     * @private
     * @static
     * @param {Array<string>} array
     * @param {string} element
     * @returns {boolean}
     * 
     * @memberOf Scope
     */
    private static arrayContains(array : Array<string>, element : string) : boolean {
        for (var index = 0; index < array.length; index++) {
            if (array[index] === element) {
                return true;
            }
        }
        return false;
    }
}
Scope.intializeScopes();