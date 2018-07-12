define(['app', '../util'], function (app, util) {
  'use strict';

  /**
   * All Tango Cloud usage related data services
   */
  app.factory('TangoCloudService', function (queryResource, $q, AuthService) {
    var USAGE_DEFAULT = { core : 0, cost : 0, count: 0 };

    // both summaries and totals has searchHash as the first key
    // summaries: usage data with extended user information
    var summaries = {}, totals = {}, grandTotals = {};

    // get Tango Cloud usage between startTs and endTs
    // return a promise
    function summary(startTs, endTs) {
      var nq = queryResource.build(sessionStorage['record']);
      var args = {
        object: '/usage/tangocloudvm/',
        email: AuthService.getUserEmail(),
        start: startTs,
        end: endTs
      };
      return nq.queryNoHeader(args).$promise;
    }

    // {
    //   "account": "University of Adelaide",
    //   "ram": 64,
    //   "price": 240,
    //   "totalFee": 946.8489497716896,
    //   "managerName": "Stuart Brown",
    //   "avgUptime": 98.90237336114613,
    //   "managerEmail": "s.brown@adelaide.edu.au",
    //   "os": "Microsoft Windows Server 2012 (64-bit)",
    //   "unit": "School of Biological Sciences",
    //   "server_id": "vm-2142",
    //   "orderline_id": 1,
    //   "totalSpan": 2086,
    //   "core": 16,
    //   "avgStorage": 252.95607050435697,
    //   "business_unit": "UOFA",
    //   "server": "CEDVM3.ad.ersa.edu.au",
    //   "identifier": "vm-2142",
    //   "name": "Adelaide Global Ecology CED Tango VMs"
    // }
    function processUsages(usageSource) {
      var tmpTotals = {}, extendedUsage = angular.copy(usageSource);
      tmpTotals['Grand'] = angular.copy(USAGE_DEFAULT);

      for (var i = 0; i < usageSource.length; i++) {
        subtotal(usageSource[i], tmpTotals);
      }
      var grandTotal = tmpTotals['Grand'];
      delete tmpTotals['Grand'];

      return {
        summaries: usageSource,
        totals: tmpTotals,
        grandTotals: grandTotal
        };
    };


    // local
    function subtotal(entry, saveTo) {
      var level1 = 'account' in entry ? entry['account'] : '?',
        level2 = 'unit' in entry ? entry['unit'] : '?';
      if (!(level1 in saveTo)) {
        saveTo[level1] = {};
        saveTo[level1]['Grand'] = angular.copy(USAGE_DEFAULT);
      }
      if (!(level2 in saveTo[level1])) {
        saveTo[level1][level2] = angular.copy(USAGE_DEFAULT);
      }
      saveTo['Grand']['count'] += 1;
      saveTo['Grand']['core'] += entry['core'];
      saveTo['Grand']['cost'] += entry['totalFee'];

      saveTo[level1][level2]['count'] += 1;
      saveTo[level1][level2]['core'] += entry['core'];
      saveTo[level1][level2]['cost'] += entry['totalFee'];

      saveTo[level1]['Grand']['count'] += 1;
      saveTo[level1]['Grand']['core'] += entry['core'];
      saveTo[level1]['Grand']['cost'] += entry['totalFee'];
    };

    return {
      query: function query(startTs, endTs) {
        var deferred = $q.defer(),
          searchHash = util.hashSearch([startTs, endTs]);
        if (Object.keys(totals).length > 0 && searchHash in summaries  && searchHash in totals) {
          deferred.resolve(true);
        } else {
          summary(startTs, endTs).then(function(result) {
            return processUsages(result);
          }).then(function(result) {
            summaries[searchHash] = result['summaries'];
            totals[searchHash] = result['totals'];
            grandTotals[searchHash] = result['grandTotals'];
            deferred.resolve(true);
          }).catch(function(error) {
            console.log(error);
            alert("No data is available for this period.");
            deferred.reject(false);
          });
        }
        return deferred.promise;
      },
      getUsages: function getUsages(startTs, endTs, orgName) {
        var tmpSummaries = util.getCached(summaries, [startTs, endTs]);
        if (orgName) {
          var result = [];
          for (var i = 0; i < tmpSummaries.length; i++) {
            if (tmpSummaries[i]['account'] == orgName) {
              result.push(tmpSummaries[i]);
            }
          }
          return result;
        } else {
          return tmpSummaries;
        }
      },
      getSubTotals: function getSubTotals(startTs, endTs, orgName) {
        return util.rearrange(util.getCached(totals, [startTs, endTs], orgName));
      },
      getGrandTotal: function getTotal(startTs, endTs) {
        // only for admin view
        return grandTotals[util.hashSearch([startTs, endTs])];
      }
    };
  });
});