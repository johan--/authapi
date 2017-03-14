import  {expect} from "chai";
let LinkedinUtil = require('../../../src/linkedin/linkedin-util')


describe("Linkedin util",function(){
    it("should create user based on the linkedin profile of user and return the same",function(){
        let linkedinProfile:any={
            "id" : "someId",
            "_json" : {
                "emailAddress" : "testUser@gmail.com",
                "firstName" : "userFirstName",
                "lastName"  : "userLastName"
            }
        }

        expect(LinkedinUtil.createUserFromLinkedinProfile(linkedinProfile).socialId).to.be.equal(linkedinProfile.id);
        expect(LinkedinUtil.createUserFromLinkedinProfile(linkedinProfile).username).to.be.equal(linkedinProfile._json.emailAddress);
        expect(LinkedinUtil.createUserFromLinkedinProfile(linkedinProfile).email).to.be.equal(linkedinProfile._json.emailAddress);
        expect(LinkedinUtil.createUserFromLinkedinProfile(linkedinProfile).accessToken.length).to.be.equal(0);
        expect(LinkedinUtil.createUserFromLinkedinProfile(linkedinProfile).firstName).to.be.equal(linkedinProfile._json.firstName);
        expect(LinkedinUtil.createUserFromLinkedinProfile(linkedinProfile).lastName).to.be.equal(linkedinProfile._json.lastName);

    });
});