var config = require("../config")
class ApplicationConfig{
    public static SMTP_HOST = config.SMTP_HOST;
    public static FROM_EMAIL: String = config.FROM_EMAIL;
    public static MONGO_DB_URL: String = config.MONGO_DB_URL;
    public static MONGO_DB_CONFIG = config.MONGO;
    public static APPLICATION_PORT = config.APPLICATION_PORT;
    public static ORCID_CONFIG = config.ORCID;
    public static FACEBOOK_CONFIG = config.FACEBOOK;
    public static TWITTER_CONFIG = config.TWITTER;
    public static LINKEDIN_CONFIG = config.LINKEDIN;
    public static GOOGLE_CONFIG = config.GOOGLE;
    public static IPMGMT_CONFIG = config.IPMGMT;
    public static REDIRECT_CONFIG = config.REDIRECT;
	public static WHITELISTED_DOMAIN = config.WHITELISTED_DOMAIN;
    public static LOG_PATH = '/var/log/tandf/';
    public static APP_LOG_PATH = '/var/log/tandf/authuserapi-v2/';
}
export = ApplicationConfig;