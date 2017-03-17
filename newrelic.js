'use strict'

/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name: "auth-user-api-v2",

  agent_enabled : true,
  /**
   * Your New Relic license key.
   */
  license_key: '59a4e37f66a0668d20df5be312e88b20fa13558e',

  logging: {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level: 'info'
  },

  transaction_tracer : {
    enabled : true,
    record_sql : true
  },

  capture_params : true,
  "browser_monitoring.enable" : true,
  "error_collector" : {
    enabled : true
  },
  transaction_events : {
    enabled : true
  },

  slow_sql : {
    enabled : true
  },

  datastore_tracer :  {
    "instance_reporting.enabled" : true,
    "database_name_reporting.enabled" : true
  }
}
