define(['app', '../util', 'services/contract', '../options', 'lodash', './hpc-rollup'], function(app, util, contract, options, _, rollup) {
  'use strict';

  /**
   * All High performance computing (HPC) related data services.
   */
  app.factory('HPCService', function (queryResource, $q, $http, org, AuthService) {
    var contractService = contract($http, $q, org, 'ersaaccount', 'managerusername', AuthService);
    var BASE_URL = sessionStorage['hpc'];
    var nq = queryResource.build(BASE_URL);
    var USAGE_DEFAULT = {
      "cores": 0,
      "cpu_seconds": 0,
      "hours": 0,
      "job_count": 0,
      "cost": 0
    };

    // summaries, totals and userRollupCache have searchHash as the first key
    // summaries: usage data with extended user information
    var summaries = {}
    var totals = {}
    var grandTotal = {}
    var userRollupCache = {}
    var userRollupErrorCache = {}

    // get a summary of HPC jobs between startTs and endTs grouped by owner and queue
    // return a promise
    function summary(startTs, endTs) {
      var args = {
        object: 'job',
        method: 'summary',
        start: startTs,
        end: endTs
      };
      return nq.query(args).$promise;
    }

    // {
    //     "cores": 15,
    //     "cpu_seconds": 301008,
    //     "job_count": 15,
    //     "owner": "akartusinski",
    //     "queue": "tizard"
    // },
    function subtotal(entry, saveTo) {
      var level1 = 'biller' in entry ? entry['biller'] : '?',
        level2 = 'managerunit' in entry ? entry['managerunit'] : '?';
      if (!(level1 in saveTo)) {
        saveTo[level1] = {};
        saveTo[level1]['Grand'] = angular.copy(USAGE_DEFAULT);
      }
      if (!(level2 in saveTo[level1])) {
        saveTo[level1][level2] = angular.copy(USAGE_DEFAULT);
      }
      add(entry, saveTo[level1][level2]);
      add(entry, saveTo[level1]['Grand']);
      add(entry, saveTo['Grand']);
    }

    // TODO: can it be moved to util to be shared?
    function add(source, target) {
      var fields = ['cores', 'cpu_seconds', 'job_count', 'hours', 'cost'], l = fields.length, i;
      for (i = 0; i < l; i++) {
        target[fields[i]] += source[fields[i]];
      }
    }

    return {
      query: function (startTs, endTs) {
        var deferred = $q.defer(),
          searchHash = util.hashSearch([startTs, endTs]);
        if (Object.keys(totals).length > 0 && searchHash in summaries  && searchHash in totals) {
          deferred.resolve(true);
        } else {
          summary(startTs, endTs).then(function(result) {
            totals[searchHash] = {Grand: angular.copy(USAGE_DEFAULT)};
            contractService.getContracts().then(function(contracts) {
              result.forEach(function(entry) {
                var username = entry['owner'];
                if (username in contracts) {
                  const accountInfoForUser = contracts[username];
                  angular.extend(entry, accountInfoForUser);
                  entry['hours'] = entry['cpu_seconds'] / 3600;
                  entry['cost'] = entry['hours'] * entry['unitPrice'];
                  subtotal(entry, totals[searchHash]);
                }
              });
              summaries[searchHash] = result;

              grandTotal[searchHash] = totals[searchHash]['Grand'];
              delete totals[searchHash]['Grand'];

              if (AuthService.isAdmin()) {
                try {
                  var rollupResponse = rollup.createUserRollup(summaries[searchHash])
                  userRollupErrorCache[searchHash] = {
                    isAllSuccess: rollupResponse.isAllSuccess,
                    errorCount: rollupResponse.errorCount
                  }
                  userRollupCache[searchHash] = rollupResponse.rollupResult
                } catch (e) {
                  console.error(e);
                  deferred.reject(false);
                  throw e;
                }
              }
              deferred.resolve(true);
            }, function(reason) {
              console.error("Retrieve contracts failed, ", reason);
              deferred.reject(false);
            });
          }, function(reason) {
            console.log(reason);
            deferred.reject(false);
          });
        }
        return deferred.promise;
      },
      getJobCounts: function (startTs, endTs, orgName) {
        var tmpSummaries = util.getCached(summaries, [startTs, endTs]);
        if (orgName) {
          var result = [];
          for (var i = 0; i < tmpSummaries.length; i++) {
            if (tmpSummaries[i]['biller'] == orgName) {
              result.push(tmpSummaries[i]);
            }
          }
          return result;
        } else {
          return tmpSummaries;
        }
      },
      getSubTotals: function (startTs, endTs, orgName) {
        // FIXME: util.rearrange - hard coded to billing and organisation
        return util.rearrange(util.getCached(totals, [startTs, endTs], orgName));
      },
      getGrandTotal: function (startTs, endTs) {
        // only for admin view
        return util.getCached(grandTotal, [startTs, endTs]);
      },
      getUserRollup: function (startTs, endTs) {
        return util.getCached(userRollupCache, [startTs, endTs]);
      },
      getUserRollupErrorData: function (startTs, endTs) {
        return util.getCached(userRollupErrorCache, [startTs, endTs])
      }
    };
  });
});