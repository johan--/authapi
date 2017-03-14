import { User } from "./user";
import { Funding } from "./funding";
import { Institution } from "./institution";

/**
 * @export
 * @class OrcidUser
 * @extends {User}
 */
export class OrcidUser extends User {
    orcidId : string;
    creditName: string;
    lastUpdatedOn : number;
    otherNames: Array<string>;
    authorInstitution : Array<Institution>;
    coAuthors : Array<Object>;
    fundings : Array<Funding>;
    orcidAccessToken: string;
}