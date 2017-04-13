define(['app', '../util', '../options', 'lodash'], function(app, util, options, _) {
  'use strict';

  function createUserRollup (detailRows) {
    var fieldsToSum = ['hours', 'cost', 'job_count', 'cores', 'cpu_seconds']
    var fieldsToIgnore = ['queue']
    var groupedAndSummed = _.reduce(detailRows, function (res, currRow) {
      var username = currRow['username']
      if (!res[username]) {
        var copy = angular.copy(currRow)
        delete copy.queue
        res[username] = copy
        return res
      }
      var existing = res[username]
      fieldsToSum.forEach(function (currField) {
        existing[currField] = doSum(existing[currField], currRow[currField])
      })
      var fieldsToNotAssertEquality = _.union(fieldsToSum, fieldsToIgnore)
      var fieldsToAssertEquality = _.difference(Object.keys(currRow), fieldsToNotAssertEquality)
      fieldsToAssertEquality.forEach(function (currField) {
        assertEqual(existing[currField], currRow[currField])
      })
      res[username] = existing
      return res
    }, {})
    return _.values(groupedAndSummed)
  }

  function assertEqual (val1, val2) {
    if (val1 === val2) {
      return
    }
    throw 'Data problem: expected "' + val1 + '" and "' + val2 + '" to be equal'
  }

  function doSum (val1, val2) {
    return (val1 || 0) + (val2 || 0)
  }

  /**
   * All High performance computing (HPC) related data services.
   */
  var PAYEES = options['hpc']['payees'], SHARED_AMOUNT = options['hpc']['sharedAmount'];

  /* Split sharedAmount amount payees
   * @param item String key of the value used for calculation
   */
  function calculateUnitPrice(totalUsages, sharedAmount, item) {
    var sum = 0;
    PAYEES.forEach(function(payee) {
      if (payee in totalUsages) {
        sum += totalUsages[payee]['Grand'][item];
      }
    });
    return sharedAmount / sum;
  }

  function calculateCost(usages, price, item) {
    usages.forEach(function (usage) {
      if (PAYEES.indexOf(usage['billing']) > -1) {
        usage['cost'] = usage[item] * price;
      }
    });
  }

  app.factory('HPCService', function (queryResource, $q, org) {
    var BASE_URL = sessionStorage['hpc']
    var nq = queryResource.build(BASE_URL)
    var USAGE_DEFAULT = {
      cores: 0,
      "cpu_seconds": 0,
      "hours": 0,
      "job_count": 0
    }

    // summaries, totals and userRollupCache have searchHash as the first key
    // summaries: usage data with extended user information
    var summaries = {}
    var totals = {}
    var grandTotal = {}
    var userRollupCache = {}

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

    // FIXME: here we have a security risk: even institutional user need to download all user accounts
    PAYEES.forEach(function(payee) {
      org.getUsersOf(org.getOrganisationId(payee));
    });
    function getAccounts() {
      return org.getAllAccounts();
    }

    // {
    //     "cores": 15,
    //     "cpu_seconds": 301008,
    //     "job_count": 15,
    //     "owner": "akartusinski",
    //     "queue": "tizard"
    // },
    function subtotal(entry, saveTo) {
      var level1 = 'billing' in entry ? entry['billing'] : '?',
        level2 = 'organisation' in entry ? entry['organisation'] : '?';
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

    // FIXME: can it move to util to be shared?
    function add(source, target) {
      var fields = ['cores', 'cpu_seconds', 'job_count', 'hours'], l = fields.length, i;
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
            var accounts = getAccounts();
            result.forEach(function(entry) {
              angular.extend(entry, accounts[entry['owner']]);
              entry['hours'] = entry['cpu_seconds'] / 3600;
              subtotal(entry, totals[searchHash]);
            });
            var price = calculateUnitPrice(totals[searchHash], SHARED_AMOUNT, 'cpu_seconds');
            summaries[searchHash] = result;
            calculateCost(summaries[searchHash], price, 'cpu_seconds');

            grandTotal[searchHash] = totals[searchHash]['Grand'];
            grandTotal[searchHash]['cost'] = SHARED_AMOUNT;
            delete totals[searchHash]['Grand'];

            var usageArray = util.rearrange(totals[searchHash]);
            calculateCost(usageArray, price, 'cpu_seconds');
            totals[searchHash] = util.inflate(usageArray, 'billing', 'organisation');
            userRollupCache[searchHash] = createUserRollup(summaries[searchHash])
            deferred.resolve(true);
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
            if (tmpSummaries[i]['billing'] == orgName) {
              result.push(tmpSummaries[i]);
            }
          }
          return result;
        } else {
          return tmpSummaries;
        }
      },
      getSubTotals: function (startTs, endTs, orgName) {
        return util.rearrange(util.getCached(totals, [startTs, endTs], orgName));
      },
      getGrandTotal: function (startTs, endTs) {
        // only for admin view
        return util.getCached(grandTotal, [startTs, endTs]);
      },
      getUserRollup: function (startTs, endTs) {
        return util.getCached(userRollupCache, [startTs, endTs]);
      },
      _test_only: {
        createUserRollup: createUserRollup,
        assertEqual: assertEqual,
        doSum: doSum
      }
    };
  });
});