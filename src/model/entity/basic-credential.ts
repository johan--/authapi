import { ICredential } from "./credential";

/**
 * @export
 * @class BasicCredential
 * @implements {ICredential}
 */
export class BasicCredential implements ICredential {
	username: string;
	password: string;
	resetPasswordToken: string;
}