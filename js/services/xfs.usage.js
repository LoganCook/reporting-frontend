define(['app', '../util', 'services/storage'], function (app, util) {
  'use strict';

  /**
   * All xfs.usage related data services?
   */
  app.factory('XFSUsageService', function (Storage, $q) {
    // should come from options.
    var BlockPrice = 5;

    // both summaries and totals has searchHash as the first key
    // summaries: usage data with extended user information
    var summaries = {}, totals = {}, grandTotals = {};

    var usageService = new Storage(sessionStorage['xfs']);

    // implement local version of data entries
    usageService.processEntry = function(entry, accounts) {
      entry['raw'] = entry['usage'] * 1024;
      entry['usage'] = util.toGB(entry['raw']);
      entry['blocks'] = Math.ceil(entry['usage'] / usageService.BlockSize);
      entry['cost'] = BlockPrice * entry['blocks'];
      angular.extend(entry, accounts[entry['filesystem']]);
    };

    // get a summary of a filesystem between startTs and endTs from endpoint
    // return a promise
    function summary(startTs, endTs) {
      var args = {
        object: 'usage',
        method: 'summary',
        start: startTs,
        end: endTs
      };
      return usageService.nq.query(args).$promise;
    }

    return {
      query: function query(startTs, endTs, isDisableBlacklist) {
        var deferred = $q.defer(),
          searchHash = util.hashSearch([startTs, endTs, isDisableBlacklist]);
        if (Object.keys(totals).length > 0 && searchHash in summaries  && searchHash in totals) {
          deferred.resolve(true);
        } else {
          usageService.prepareData(summary(startTs, endTs), isDisableBlacklist).then(function(result) {
            summaries[searchHash] = result['summaries'];
            totals[searchHash] = result['totals'];
            grandTotals[searchHash] = result['grandTotals'];
            deferred.resolve(true);
          }, function(reason) {
              console.log(reason);
              deferred.reject(false);
          });
        }
        return deferred.promise;
      },
      getUsages: function getUsages(startTs, endTs, orgName, isDisableBlacklist) {
        var tmpSummaries = summaries[util.hashSearch([startTs, endTs, isDisableBlacklist])];
        if (orgName) {
          var result = [];
          for (var i = 0; i < tmpSummaries.length; i++) {
            if (tmpSummaries[i]['billing'] == orgName) {
              result.push(tmpSummaries[i]);
            }
          }
          return result;
        } else {
          return tmpSummaries;
        }
      },
      getTotals: function getTotals(startTs, endTs, orgName, isDisableBlacklist) {
        return util.rearrange(util.getCached(totals, [startTs, endTs, isDisableBlacklist], orgName));
      },
      getGrandTotals: function getTotals(startTs, endTs, isDisableBlacklist) {
        // only for admin view
        return grandTotals[util.hashSearch([startTs, endTs, isDisableBlacklist])];
      }
    };
  });
});