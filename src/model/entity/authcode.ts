/**
 * @export
 * @class AuthorizationCode
 */
export class AuthorizationCode {
    user: string;
    client : string;
    sub : string;
    scope : Array<string>;
    code : string;
    redirectUri : string;
    responseType : string;
    status : string;
}