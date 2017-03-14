/**
 * @export
 * @class AuthorizationCode
 */
export class AuthorizationCode {
    user: String;
    client : String;
    scope : Array<String>;
    code : String;
    redirectUri : String;
    responseType : String;
    status : String;
}