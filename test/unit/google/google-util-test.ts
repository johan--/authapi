import  {expect} from "chai";
let GoogleUtil = require('../../../src/google/google-util')


describe("Google util",function(){
    it("should create user based on the google profile of user and return the same",function(){
        let googleProfile:any={
            "id" : "someId123",
            "email" : "googleUser@gmail.com",
            "name" : {
                "givenName":"userGivenName",
                "familyName":"userFamilyName"
            }
        }
        expect(GoogleUtil.createUserFromGoogleProfile(googleProfile).socialId).to.be.equal(googleProfile.id);
        expect(GoogleUtil.createUserFromGoogleProfile(googleProfile).username).to.be.equal(googleProfile.email);
        expect(GoogleUtil.createUserFromGoogleProfile(googleProfile).email).to.be.equal(googleProfile.email);
        expect(GoogleUtil.createUserFromGoogleProfile(googleProfile).firstName).to.be.equal(googleProfile.name.givenName);
        expect(GoogleUtil.createUserFromGoogleProfile(googleProfile).lastName).to.be.equal(googleProfile.name.familyName);
    })
});