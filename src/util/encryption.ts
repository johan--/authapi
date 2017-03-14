'use strict'
import bcrypt = require("bcryptjs");
import { Logger } from './logger';

const log = new Logger('util/encryption');

export class EncryptionUtil {
    /**
     * encription of the input string
     * 
     * @static
     * @param {string} stringToEncrypt
     * @returns {string}
     * 
     * @memberOf EncryptionUtil
     */
    public static encrypt(stringToEncrypt: string): string {
        let salt = bcrypt.genSaltSync(10);
        let hash = bcrypt.hashSync(stringToEncrypt as string, salt);
        log.debug("EncryptionUtil: Encription done successfully");
        return hash;
    }

    /**
     * validating encrypted string with original string
     * 
     * @static
     * @param {String} encryptedString
     * @param {String} originalString
     * @returns {Boolean}
     * 
     * @memberOf EncryptionUtil
     */
    public static validate(encryptedString: string, originalString: string): Boolean {
        let validated: boolean = false;

        //encryptedString = hash , originalString = password
        let savedHash: string = encryptedString;
        let password: string = originalString;
        let salt: string = '';

        //1. extract the salt from encryptedString
        if (savedHash.length < 59) {
            log.debug(" EncryptionUtil: encryptedString is not long enough to be a hash");
        } else {
            try {
                salt = bcrypt.getSalt(savedHash as string);

                //2. using the salt encrypt the originalString into generated hash
                let hash = bcrypt.hashSync(password as string, salt);

                //3. Compare the encryptedString and the generated hash and return
                if (savedHash === hash) {
                    validated = true;
                } else {
                    validated = false;
                }
            } catch (error) {
                log.error("Unable to decrypt the encryptedString:", error);
                validated = false;
            }
        }
        log.debug(" EncryptionUtil: Authentication is '" + validated + "'");
        return validated;
    }
}