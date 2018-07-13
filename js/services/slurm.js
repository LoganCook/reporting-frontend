define(['app', 'services/usage-record'], function (app, Usage) {  
  'use strict';

  /**
   * All High performance computing (HPC) - Slurm/Tizard combined data services.
   */
  app.factory('SlurmService', function ($q, queryResource, AuthService) {
    var common = Usage($q, queryResource, AuthService.getUserEmail(), 'hpc', ['totalCount', 'totalCPUHours']);
    common.getJobCounts = common.getUsages;
    common.getUserRollup = function () { return []};
    common.getUserRollupErrorData = function () { return []};
    return common;
  });
});