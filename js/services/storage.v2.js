define(['app', 'services/usage-record', '../util', 'services/storage.v2-rollup'], function (app, Usage, util, rollup) {  
  'use strict';

  /**
   * All storage related data queries
   */
  app.factory('StorageService', function ($q, queryResource, AuthService) {
    // userRollupCache and userRollupErrorCache have searchHash as the first key
    var userRollupCache = {}, userRollupErrorCache = {};

    var baseUsage = Usage($q, queryResource, AuthService.getUserEmail(), 'storage', ['avgUsage']);
    var storageUsage = angular.copy(baseUsage);

    if (AuthService.isAdmin()) {
      storageUsage.getUserRollup = function (startTs, endTs) {
        try {
          var rollupResponse = rollup.createUserRollup(storageUsage.getUsages(startTs, endTs)),
            searchHash = util.hashSearch([startTs, endTs]);
          userRollupErrorCache[searchHash] = {
            isAllSuccess: rollupResponse.isAllSuccess,
            errors: rollupResponse.errors
          };
          userRollupCache[searchHash] = rollupResponse.rollupResult;
        } catch (e) {
          console.error(e);
          throw e;
        }
        return util.getCached(userRollupCache, [startTs, endTs]);
      };
      storageUsage.getUserRollupErrorData = function (startTs, endTs) {
        return util.getCached(userRollupErrorCache, [startTs, endTs]);
      };
    };

    return storageUsage;
  });
});
