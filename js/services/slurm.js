define(['app', 'services/usage-record', '../util', 'services/slurm-rollup'], function (app, Usage, util, rollup) {  
  'use strict';

  /**
   * All High performance computing (HPC) - Slurm/Tizard combined data services.
   */
  app.factory('SlurmService', function ($q, queryResource, AuthService) {
    // userRollupCache and userRollupErrorCache have searchHash as the first key
    var userRollupCache = {}, userRollupErrorCache = {};

    var baseUsage = Usage($q, queryResource, AuthService.getUserEmail(), 'hpc', ['totalCount', 'totalCPUHours']);
    var slurmUsage = angular.copy(baseUsage);

    // override getUsages to split identifier to owner and partition
    slurmUsage.getUsages = function(startTs, endTs) {
      return baseUsage.getUsages(startTs, endTs).map(function(usage) {
        var parts = usage['identifier'].split(',');
        usage['user'] = parts[0];
        usage['partition'] = parts[1];
        return usage;
      });
    };

    if (AuthService.isAdmin()) {
      slurmUsage.getUserRollup = function (startTs, endTs) {
        try {
          var rollupResponse = rollup.createUserRollup(slurmUsage.getUsages(startTs, endTs)),
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
      slurmUsage.getUserRollupErrorData = function (startTs, endTs) {
        return util.getCached(userRollupErrorCache, [startTs, endTs]);
      };
    };

    return slurmUsage;
  });
});
