var HOURSAYEAR = 8760;  // 24 * 365

define(['app', '../util', 'services/contract', '../options', 'lodash', './slurm-rollup', 'services/fee-overrider'], function(app, util, contract, options, _, rollup, overrider) {
  'use strict';

  /**
   * All High performance computing (HPC) - Slurm related data services.
   */
  app.factory('SlurmService', function (queryResource, $q, $http, org, AuthService) {
    var contractService = contract($http, $q, org, 'tangocompute', 'managerusername', AuthService);
    var BASE_URL = sessionStorage['slurm'];
    var nq = queryResource.build(BASE_URL);
    var USAGE_DEFAULT = {
      "cpu_seconds": 0,
      "hours": 0,
      "cost": 0
    };

    // summaries: usage data with extended user information
    // summaries, totals and userRollupCache have searchHash as the first key
    var summaries = {}, totals = {}, grandTotal = {};
    var userRollupCache = {}, userRollupErrorCache = {};


    // Prepare an array of queues will be excluded from calculation
    var queueExcluded = [];
    if ('slurm' in options && 'partitions' in options['slurm'] && 'exclude' in options['slurm']['partitions']) {
      queueExcluded = options['slurm']['partitions']['exclude'];
    }

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
    //     "owner": "hero",
    //     "partition": "bigmem",
    //     "job_count": 1
    //     "cpu_seconds": 100
    // }
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
      var fields = ['cpu_seconds', 'hours', 'job_count', 'cost'], l = fields.length, i;
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
              var feeOverrider = overrider.getOverrides('slurm', startTs, endTs);
              util.convertContractPrice(contracts, HOURSAYEAR);
              result.forEach(function(entry) {
                var username = entry['owner'];
                if (username in contracts) {
                  entry['hours'] = entry['cpu_seconds'] / 3600;
                  // if entry is not in excluding queues, include it in linking and calculation:
                  if (queueExcluded.indexOf(entry['partition']) == -1 ) {
                    angular.extend(entry, contracts[username]);
                    if (feeOverrider && username in feeOverrider) {
                      console.warn("slurm: fee has been overriden for", username, "as", feeOverrider[username], "between", startTs, endTs);
                      entry['cost'] = feeOverrider[username];
                    } else {
                      entry['cost'] = entry['hours'] * entry['unitPrice'];
                    }
                    subtotal(entry, totals[searchHash]);
                  }
                }
              });
              summaries[searchHash] = result;

              grandTotal[searchHash] = totals[searchHash]['Grand'];
              delete totals[searchHash]['Grand'];

              if (AuthService.isAdmin()) {
                try {
                  var rollupResponse = rollup.createUserRollup(summaries[searchHash]);
                  userRollupErrorCache[searchHash] = {
                    isAllSuccess: rollupResponse.isAllSuccess,
                    errors: rollupResponse.errors
                  };
                  userRollupCache[searchHash] = rollupResponse.rollupResult;
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
        return util.getCached(userRollupErrorCache, [startTs, endTs]);
      }
    };
  });
});