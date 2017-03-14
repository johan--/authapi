/**
 * @export
 * @class Client
 */
export class Client {
    id : string
    username: string;
    name : string;
    clientId : string;
    clientSecret : string;
    credentialsFlow : boolean;
    redirect_uris : Array<string>;
    /**
     * Creates an instance of Client.
     * 
     * @param {string} username
     * @param {string} name
     * @param {string} clientId
     * @param {string} clientSecret
     * @param {boolean} credentialsFlow
     * @param {Array<string>} redirectURIS
     * 
     * @memberOf Client
     */
    constructor(username : string, name : string, clientId: string, clientSecret : string, credentialsFlow : boolean, redirectURIS : Array<string>) {
        this.username = username;
        this.name = name;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.credentialsFlow = credentialsFlow;
        this.redirect_uris = redirectURIS;
    }
}