import OrcidDataTransformUtil = require("../../../src/orcid/data-transform-util")
import IOrcidUser = require('../../../src/model/entity/orcid-user')
import IUser = require("../../../src/model/entity/user");
import TestUtil = require("../util/test-util");
let expect = require("chai").expect;
let util:TestUtil=new TestUtil();
describe("Ofcid Datatrnsaform Util",function(){

   it("should form user form orchid profile values and return user profile ",function(){
       let orchidProfileObject :any = util.createOrcidProfile();
       let orchidProfile :HTMLBodyElement= orchidProfileObject;
       let expectedUser:IUser = OrcidDataTransformUtil.createUserFromOrcidProfile(orchidProfile); 
       let expectedOrcidUser = <IOrcidUser> expectedUser;
       
       expect(expectedOrcidUser.lastUpdatedOn).to.be.equal(orchidProfileObject['orcid-profile']['orcid-history']['last-modified-date']);
       expect(expectedOrcidUser.orcidId).to.be.equal(orchidProfileObject['orcid-profile']['orcid-identifier']['path']);
       expect(expectedOrcidUser.username).to.be.equal(orchidProfileObject['orcid-profile']['orcid-identifier']['path']);
       expect(expectedOrcidUser.email).to.be.equal(orchidProfileObject['orcid-profile']['orcid-identifier']['path']);
       expect(expectedOrcidUser.firstName).to.be.equal(orchidProfileObject['orcid-profile']['orcid-bio']['personal-details']['given-names']['value']);
       expect(expectedOrcidUser.lastName).to.be.equal(orchidProfileObject['orcid-profile']['orcid-bio']['personal-details']['family-name']['value']);
       expect(expectedOrcidUser.accessToken[0].username).to.be.equal(orchidProfileObject['orcid-profile']['orcid-identifier']['path']); 
       expect(expectedOrcidUser.otherNames).to.be.deep.equal(['OtherName']); 
       expect(expectedOrcidUser.creditName).to.be.equal(orchidProfileObject['orcid-profile']['orcid-bio']['personal-details']['credit-name']['value']);
  
        let authorInstitution : Array<any> = [ { name: 'someName',
                address: { city: 'someCity', country: 'someCity', region: 'someregion' },
                type: orchidProfileObject['orcid-profile']['orcid-activities']['affiliations']['affiliation'][0]['type'],
                visibility: orchidProfileObject['orcid-profile']['orcid-activities']['affiliations']['affiliation'][0]['visibility'],
                startDate: "August/12/2016",
                endDate: "October/12/2017",
                jobTitle: orchidProfileObject['orcid-profile']['orcid-activities']['affiliations']['affiliation'][0]['role-title'],
                department: orchidProfileObject['orcid-profile']['orcid-activities']['affiliations']['affiliation'][0]['department-name']} ]
       expect(expectedOrcidUser.authorInstitution).to.be.deep.equal(authorInstitution); 

       let fundings : Array<any> = [ { fundingType: 'someFundingType',
                visibility: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['visibility'],
                fundingOrganisation: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['organization']['name'],
                address: { 
                    city: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['organization']['address']['city'], 
                    country: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['organization']['address']['country'], 
                    region: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['organization']['address']['region'] },
                currencyCode: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['amount']['currency-code'],
                startDate: 'August/12/2016',
                endDate: 'October/12/2017',
                fundingUrl: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['url']['value'],
                grantNumber: 123 } ]
      expect(expectedOrcidUser.fundings).to.be.deep.equal(fundings); 

      let coAuthors : Array<any> =[ 
          { 
            orcidId: 'Id1',
            name: 'someActivityCreditName1',
            email: 'contributerEmail1@gmail.com',
            role: 'role1'
           },
            {
            orcidId: 'Id2',
            name: 'someActivityCreditName2',
            email: 'contributerEmail2@gmail.com',
            role: 'role2'
           } ]
      expect(expectedOrcidUser.coAuthors).to.be.deep.equal(coAuthors); 
 }); 


 it("should create coAuthors object from the orcid profile activities and return the same",function(){
      let orchidProfileObject :any = util.createOrcidProfile();
      let activities:any = orchidProfileObject['orcid-profile']['orcid-activities'];
      let coAuthors : Array<any> =[ 
          { 
            orcidId: 'Id1',
            name: 'someActivityCreditName1',
            email: 'contributerEmail1@gmail.com',
            role: 'role1'
           },
            {
            orcidId: 'Id2',
            name: 'someActivityCreditName2',
            email: 'contributerEmail2@gmail.com',
            role: 'role2'
           } ]
      expect(OrcidDataTransformUtil.getCoAuthors(activities)).to.be.deep.equal(coAuthors);

 });

 it("should return fundings object from orchid profile activities ",function(){
     let orchidProfileObject :any = util.createOrcidProfile();
     let activities:any = orchidProfileObject['orcid-profile']['orcid-activities'];
     let fundings : Array<any> = [ { fundingType: 'someFundingType',
                visibility: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['visibility'],
                fundingOrganisation: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['organization']['name'],
                address: { 
                    city: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['organization']['address']['city'], 
                    country: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['organization']['address']['country'], 
                    region: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['organization']['address']['region'] },
                currencyCode: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['amount']['currency-code'],
                startDate: 'August/12/2016',
                endDate: 'October/12/2017',
                fundingUrl: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['url']['value'],
                grantNumber: 123 } ]
     expect(OrcidDataTransformUtil.getFundings(activities)).to.be.deep.equal(fundings);
     
 });

 it("should create funding object from each funding in array and return the same",function(){
       let orchidProfileObject :any = util.createOrcidProfile();
       let funding:any = orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0];
       let resultFunding : any ={
            fundingType: 'someFundingType',
            visibility: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['visibility'],
            fundingOrganisation: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['organization']['name'],
            address: { 
                city: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['organization']['address']['city'], 
                country: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['organization']['address']['country'], 
                region: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['organization']['address']['region'] },
            currencyCode: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['amount']['currency-code'],
            startDate: 'August/12/2016',
            endDate: 'October/12/2017',
            fundingUrl: orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['url']['value'],
            grantNumber: 123 
        } 
       expect(OrcidDataTransformUtil.createFunding(funding)).to.be.deep.equal(resultFunding);
 });


 it("should create grantNumber object from orcidFundingIdentifier and return the same",function(){
     let orchidProfileObject :any = util.createOrcidProfile();
     let orcidFundingIdentifier : any = orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]["funding-external-identifiers"]["funding-external-identifier"];
    let grantNumber:any =orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]["funding-external-identifiers"]["funding-external-identifier"][0]['funding-external-identifier-value'];
     expect(OrcidDataTransformUtil.getGrantNumber(orcidFundingIdentifier)).to.be.deep.equal(grantNumber);
 });

 it("it should format date based on month, day and year value and return the same",function(){
     let orchidProfileObject :any = util.createOrcidProfile();
     let startDate:any = orchidProfileObject['orcid-profile']['orcid-activities']['funding-list']['funding'][0]['start-date'];
     expect(OrcidDataTransformUtil.formatDate(startDate)).to.be.equal("August/12/2016");
 });

it("should get Author institutions based on from the orcid profile activities and return the same",function(){
    let orchidProfileObject :any = util.createOrcidProfile();
    let activities:any = orchidProfileObject['orcid-profile']['orcid-activities'];
     let authorInstitution : Array<any> = [ { name: 'someName',
                address: { city: 'someCity', country: 'someCity', region: 'someregion' },
                type: orchidProfileObject['orcid-profile']['orcid-activities']['affiliations']['affiliation'][0]['type'],
                visibility: orchidProfileObject['orcid-profile']['orcid-activities']['affiliations']['affiliation'][0]['visibility'],
                startDate: "August/12/2016",
                endDate: "October/12/2017",
                jobTitle: orchidProfileObject['orcid-profile']['orcid-activities']['affiliations']['affiliation'][0]['role-title'],
                department: orchidProfileObject['orcid-profile']['orcid-activities']['affiliations']['affiliation'][0]['department-name']
            }]
    
    expect(OrcidDataTransformUtil.getAuthorInstitutions(activities)).to.be.deep.equal(authorInstitution);
});


it("should create instutition object based on the employement affialations passed and return the same",function(){
    let orchidProfileObject :any = util.createOrcidProfile();
    let employmentAffiliation:any = orchidProfileObject['orcid-profile']['orcid-activities']["affiliations"]["affiliation"][0];
    let instutition:any = { name: 'someName',
                address: { city: 'someCity', country: 'someCity', region: 'someregion' },
                type: orchidProfileObject['orcid-profile']['orcid-activities']['affiliations']['affiliation'][0]['type'],
                visibility: orchidProfileObject['orcid-profile']['orcid-activities']['affiliations']['affiliation'][0]['visibility'],
                startDate: "August/12/2016",
                endDate: "October/12/2017",
                jobTitle: orchidProfileObject['orcid-profile']['orcid-activities']['affiliations']['affiliation'][0]['role-title'],
                department: orchidProfileObject['orcid-profile']['orcid-activities']['affiliations']['affiliation'][0]['department-name']
            }
    expect(OrcidDataTransformUtil.createInstitution(employmentAffiliation)).to.be.deep.equal(instutition);
});

it("should return otherNames of user from the orchid profile",function(){
    let orchidProfileObject :any = util.createOrcidProfile();
    let otherNamesForUser:any = orchidProfileObject['orcid-profile']['orcid-bio']['personal-details']['other-names'];
    let otherNames :Array<String> =  [ orchidProfileObject['orcid-profile']['orcid-bio']['personal-details']['other-names']['other-name'][0].value];
    expect(OrcidDataTransformUtil.getOtherNames(otherNamesForUser)).to.be.deep.equal(otherNames);
});
});