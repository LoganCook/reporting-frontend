define(['app', '../util', 'services/storage'], function (app, util) {
  'use strict';

  /**
   * All hnas filesytem usage related data services?
   */
  app.factory('HNASFSService', function (Storage, $q) {
    var filesystemFieldName = 'filesystem';
    // should come from options.
    var BlockPrice = 5;

    // both summaries and totals has searchHash as the first key
    // summaries: usage data with extended user information
    var summaries = {}, totals = {}, grandTotals = {};

    var usageService = new Storage(sessionStorage['hnas'], filesystemFieldName);

    // implement local version of data entries
    usageService.processEntry = function(entry, allocations) {
      entry['raw'] = entry['live_usage'];
      delete entry['live_usage'];
      entry['usage'] = entry['raw'] / 1000;  // MB to GB
      entry['blocks'] = Math.ceil(entry['usage'] / usageService.BlockSize);
      angular.extend(entry, allocations[entry[filesystemFieldName]]); // hnas.fs has no owner at all
      if ('unitPrice' in entry && entry['unitPrice']) {
        entry['cost'] = entry['blocks'] * entry['unitPrice'];
      } else {
        entry['cost'] = entry['blocks'] * BlockPrice;
      }
    };

    // get a summary of a filesystem between startTs and endTs from endpoint
    // return a promise
    function summary(startTs, endTs) {
      var args = {
        object: 'filesystem/usage',
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
            angular.forEach(result['summaries'], function(value, key) {
              value.source = 'HNAS FS'
            })
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