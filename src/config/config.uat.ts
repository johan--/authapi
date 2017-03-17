
var config: any = {};
config.SMTP_HOST = { host: 'usmia-mail.crcpress.local', port: '25', secure: false };
config.FROM_EMAIL = "noreply@taylorandfrancis.com";
config.MONGO = {
    url: "mongodb://m0ng0u$er:m0ng0pa$$w0rd@ds021604-a0.mlab.com:21604,ds021604-a1.mlab.com:21604/user-uat?replicaSet=rs-ds021604"
};
config.APPLICATION_PORT = 3000;
config.env = 'uat';
config.WHITELISTED_DOMAIN = [".taylorandfrancis.com"];

let uat_clientID = "APP-PT1ZDEH227AVL02Q";
let uat_callbackURL = "http://api-uat.taylorandfrancis.com/v1/auth/user/auth/orcid/callback";

config.ORCID = {
    apiUrl:"https://api.sandbox.orcid.org/v1.2/",
    tokenURL: "https://api.sandbox.orcid.org/oauth/token",
    clientID: uat_clientID,
    clientSecret: "757c9416-e077-4708-9d84-789d38362b0a",
    callbackURL: uat_callbackURL,
    authorizationURL: "https://sandbox.orcid.org/oauth/authorize?client_id=" + uat_clientID + "&response_type=code&scope=/read-limited /activities/update&redirect_uri=" + uat_callbackURL,
    tnfClientUrls: {
        "RESEARCHER_PORTAL_LOCAL": "http://localhost:9090/login/orcid/callback",
        "RESEARCHER_PORTAL_DEV": "http://research-portal-web-dev-1955697875.eu-west-1.elb.amazonaws.com/login/orcid/callback",
        "RESEARCHER_PORTAL_PROD": "https://rp.cogentoa.com/login/orcid/callback",
        "RESEARCHER_PORTAL_STAGE" : "http://research-portal-web-stage-2047067933.eu-west-1.elb.amazonaws.com/login/orcid/callback"
    }
}

config.FACEBOOK = {
    clientID: "1214350571940554",
    clientSecret: "7eafabae1d4a271e32068b3bef842254",
    callbackURL: "http://api-uat.taylorandfrancis.com/v1/auth/user/auth/facebook/callback",
    profileFields: ['id', 'displayName', "bio", 'birthday', 'gender', 'email'
								, "first_name", "last_name", "middle_name", "hometown", "location", "work"],

}

config.TWITTER = {
    consumerKey: "DJzCYb5EO5IflIMVEjcHoOkyS",
    consumerSecret: "LOuIJodWgbnT2k4BULBsi5bBGPYdRU3oemInIFtYElqywlgUmV",
    callbackURL: "http://api-uat.taylorandfrancis.com/v1/auth/user/auth/twitter/callback"
}

config.LINKEDIN = {
    consumerKey: "785phdife9kyjv",
    consumerSecret: "83RjifJ78LsY95qb",
    callbackURL: "http://api-uat.taylorandfrancis.com/v1/auth/user/auth/linkedin/callback",
    profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline']
}

config.GOOGLE = {
    clientID: "850832438542-iki983irl5sq17mc9kscrtjj808use65.apps.googleusercontent.com",
    clientSecret: "QADP5n0xrsdRkTVrT9HDqm_m",
    callbackURL: "http://api-uat.taylorandfrancis.com/v1/auth/user/auth/google/callback"
}

//TO_DO Update the url for the ip management.
config.IPMGMT = {
    ipAuthApiUrl : 'https://api-uat.taylorandfrancis.com/v1/ipauth/authorize'
}

config.REDIRECT = {
    login_url: 'https://accounts-uat.taylorandfrancis.com/identity/#/login?authorize=true',
    verify_url: 'https://accounts-uat.taylorandfrancis.com/identity/#/verify?authorize=true',
    consent_url: 'https://api-uat.taylorandfrancis.com/v2/auth/user/auth/consent',
    identity_ui_consent_url: 'https://accounts-uat.taylorandfrancis.com/identity/#/consent',
    this_api_base_url: 'https://api-uat.taylorandfrancis.com/v2/auth',
    identity_ui_base_url: 'https://accounts-uat.taylorandfrancis.com/identity/'
}

module.exports = config;