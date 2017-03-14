let expect    = require("chai").expect;
let FacebookUtil = require('../../../src/facebook/facebook-util')


describe("Facebook util",function(){

    it(" shuold create and return user profile based on facebook profile of user passed as arguement",function(){
        let facebookProfile: any = {
            id : "facebbokId123",
            emails : [{ value: "facebookUser@gmail.com"}],
            _json : {
                first_name : "UserFirstName",
                last_name : "UserLastName"
            }
        }

        expect(FacebookUtil.createUserFromFacebookProfile(facebookProfile).socialId).to.be.equal(facebookProfile.id);
        expect(FacebookUtil.createUserFromFacebookProfile(facebookProfile).username).to.be.equal(facebookProfile.emails[0].value);
        expect(FacebookUtil.createUserFromFacebookProfile(facebookProfile).email).to.be.equal(facebookProfile.emails[0].value);
        expect(FacebookUtil.createUserFromFacebookProfile(facebookProfile).firstName).to.be.equal(facebookProfile._json.first_name);
        expect(FacebookUtil.createUserFromFacebookProfile(facebookProfile).lastName).to.be.equal(facebookProfile._json.last_name);


    });
  
});