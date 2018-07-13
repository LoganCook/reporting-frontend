define(['app', 'services/usage-record'], function (app, Usage) {
  'use strict';

  /**
   * All Tango Cloud usage related data services
   */
  app.factory('TangoCloudService', function ($q, queryResource, AuthService) {
    return Usage($q, queryResource, AuthService.getUserEmail(), 'tangocloudvm', ['core']);
  });
});