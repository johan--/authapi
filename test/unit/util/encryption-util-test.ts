var expect    = require("chai").expect;
import EncryptionUtil = require("../../../src/util/encryption-util")


describe('EncryptionDecryption', function () {    
    it('should encrypt and decrypt properly', function(){
        var originalString = "abc";
        var encryptedString = EncryptionUtil.encrypt(originalString);        
        expect(EncryptionUtil.validate(encryptedString, originalString)).to.equal(true);
    });
    
});

describe('EncryptionDecryption', function () {    
    it('should return false when encryptedString String doest corresponds to original String' , function(){
        var originalString = "abc";
        var actualEncryptedString = EncryptionUtil.encrypt(originalString);        
        expect(EncryptionUtil.validate(actualEncryptedString, originalString+"x")).to.equal(false);
    });
    
});