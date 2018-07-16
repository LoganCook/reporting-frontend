define(['../util'], function (util) {
  'use strict';

  function Usages($q, queryResource, userEmail, source, statisticsFields) {
    /** 
     * factory function for creating an instance to query, search usage data from a record source
     *  @param {[]} statisticsFields - A list of fields will be added up for statistics purpose
     */

    // both summaries and totals has searchHash as the first key
    // summaries: usage data with extended user information
    var summaries = {}, totals = {}, grandTotals = {};
    var SUMMATION_DEFAULT = { cost : 0, count: 0 };
    statisticsFields.forEach(element => {
      SUMMATION_DEFAULT[element] = 0;
    });

    // get usage for a source of an instance created by this factory between startTs and endTs
    // return a promise
    function summary(startTs, endTs) {
      var nq = queryResource.build(sessionStorage['record']);
      var args = {
        object: '/usage/' + source + '/',
        email: userEmail,
        start: startTs,
        end: endTs
      };
      return nq.queryNoHeader(args).$promise;
    }

    // {
    //   "account": "University of Adelaide",
    //   "identifier": "vm-2142",
    //   "name": "Adelaide Global Ecology CED Tango VMs"
    //   "price": 240,
    //   "totalFee": 946.8489497716896,
    //   "managerName": "Some One",
    //   "managerEmail": "some@edu.au",
    //   "unit": "School of Biological Sciences",
    //   "orderline_id": 1,
    //   ...
    //   some other fields depend on source
    //   ...
    // }
    function processUsages(usageSource) {
      var tmpTotals = {}, extendedUsage = angular.copy(usageSource);
      tmpTotals['Grand'] = angular.copy(SUMMATION_DEFAULT);

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

    function subtotal(entry, saveTo) {
      var level1 = 'account' in entry ? entry['account'] : '?',
        level2 = 'unit' in entry ? entry['unit'] : '?';
      if (!(level1 in saveTo)) {
        saveTo[level1] = {};
        saveTo[level1]['Grand'] = angular.copy(SUMMATION_DEFAULT);
      }
      if (!(level2 in saveTo[level1])) {
        saveTo[level1][level2] = angular.copy(SUMMATION_DEFAULT);
      }
      saveTo[level1][level2]['cost'] += entry['totalFee'];
      saveTo[level1]['Grand']['cost'] += entry['totalFee'];
      saveTo['Grand']['cost'] += entry['totalFee'];

      // count: optional statistics, only used in some sources, vm like services
      saveTo[level1][level2]['count'] += 1;
      saveTo[level1]['Grand']['count'] += 1;
      saveTo['Grand']['count'] += 1;

      add(entry, saveTo[level1][level2]);
      add(entry, saveTo[level1]['Grand']);
      add(entry, saveTo['Grand']);
    }

    function add(source, target) {
      var l = statisticsFields.length, i;
      for (i = 0; i < l; i++) {
        target[statisticsFields[i]] += source[statisticsFields[i]];
      }
    }

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
        return util.getCached(grandTotals, [startTs, endTs]);
      }
    };
  }

  return Usages;
});