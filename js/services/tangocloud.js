define(['app', '../util', 'services/usage-record'], function (app, util, Usage) {
  'use strict';

  /**
   * All Tango Cloud usage related data services
   */
  app.factory('TangoCloudService', function ($q, queryResource, AuthService) {
    return Usage($q, queryResource, AuthService.getUserEmail(), 'tangocloudvm', ['core']);
  });
});