var expect    = require("chai").expect;
import Helper = require("../../../src/util/helper");

describe('PasswordValidation', function(){
    it('should return error when password not have any uppercase character', function(){
        var testPassword="password@15";
        expect(Helper.validatePassword(testPassword)).to.equal.false;
    });

    it('should return error when password not have any lowercase character', function(){
        var testPassword="PASSWORD@15";
        expect(Helper.validatePassword(testPassword)).to.equal.false;
    });

    it('should return error when password not have any digit', function(){
        var testPassword="PASSWORD@-#";
        expect(Helper.validatePassword(testPassword)).to.equal.false;
    });

    it('should return error when password not have any special character', function(){
        var testPassword="Password15";
        expect(Helper.validatePassword(testPassword)).to.equal.false;
    });

    it('should return error when password not have any special character or digits', function(){
        var testPassword="Password";
        expect(Helper.validatePassword(testPassword)).to.equal.false;
    });

    it('should return error when password have less than ', function(){
        var testPassword="Pass@15";
        expect(Helper.validatePassword(testPassword)).to.equal.false;
    });
    
    it('should return true when password have at least 1 lowercase, 1 uppercase, 1 digit, 1 spc chr and must be at least 8 characters', function(){
        var testPassword="Password@-15";
        expect(Helper.validatePassword(testPassword)).to.equal.true;
    });
    
    it('should return true when password have any of these $"?@$!%*#_ +=|~?&()/.,<>`,[\]^\"\';\\:{}\- ', function(){
        var testPassword="Password@-|~?&()/.,<>`,[\]^\"\';15";
        expect(Helper.validatePassword(testPassword)).to.equal.true;
    });
})