define(['app', '../util', 'services/contract', 'options' ,'../cloud/services'], function (app, util, contract, options) {
  'use strict';

  /**
   * All nectar usage related data services
   */
  app.factory('NectarService', function (queryResource, $q, AuthService, org, $http, flavor) {
    var contractService = contract($http, $q, org, 'nectar', 'openstack_id');
    var PRICE = 5;
    if ('nova' in options && 'price' in options['nova']) {
      PRICE = options['nova']['price'];
    }
    var USAGE_DEFAULT = { core : 0, cost : 0};

    var flavors = flavor(sessionStorage['nova']);
    // both summaries and totals has searchHash as the first key
    // summaries: usage data with extended user information
    var summaries = {}, totals = {}, grandTotals = {};

    // get nectar usage between startTs and endTs from local host
    // return a promise
    // local version
    function summary(startTs, endTs) {
      var summaryUrl = 'usage/nova/NovaUsage_'  + startTs + '_' + endTs + '.json';
      return queryResource.build(summaryUrl).query({}).$promise;
    }

    // common
    function prepareData(queryPromise) {
      return queryPromise.then(function (usages) {
        return processUsages(usages);
      });
    }

    // common
    function processUsages(usages) {
      return getContracts().then(function (contracts) {
        return flavors.then(function (flavorMap) {
          return linkUsages(usages, contracts, flavorMap);
        });
      });
    };

    // common
    function getContracts() {
      var promise;
      if (AuthService.isAdmin()) {
        promise = contractService.getAll();
      } else {
        promise = contractService.getServiceOf(org.getOrganisationId(AuthService.getUserOrgName()));
      }
      return promise;
    };

    // link usage to users
    // saveTo is totals[searchHash]
    // common + local argument
   function linkUsages(usageSource, accounts, flavorMap) {
      var tmpTotals = {}, extendedUsage = angular.copy(usageSource);
      tmpTotals['Grand'] = angular.copy(USAGE_DEFAULT);

      for (var i = 0; i < usageSource.length; i++) {
        processEntry(extendedUsage[i], accounts, flavorMap);
        subtotal(extendedUsage[i], tmpTotals);
      }
      var grandTotal = tmpTotals['Grand'];
      delete tmpTotals['Grand'];

      return {
        summaries: extendedUsage,
        totals: tmpTotals,
        grandTotals: grandTotal
        };
    };

    // implement local version of data entries
    // {
    //   "tenant": "52f03cef4a324674b1797e7e842fb898",
    //   "az": "sa",
    //   "image": "d8a5813c-8dd0-49ac-a57f-2fa90b73e0e9",
    //   "span": 385851,
    //   "instance_id": "00ceebc4-1540-48ec-af08-9755d89baef7",
    //   "server": "test-hbase",
    //   "flavor": "885227de-b7ee-42af-a209-2f1ff59bc330",
    //   "server_id": "03f0e40b-106e-4375-bbe2-766102e3201e",
    //   "hypervisor": "cw-compute-05a.sa.nectar.org.au",
    //   "manager": [],
    //   "account": "96512e9119914b11aaf4a0dbdc54023c"
    // }
    function processEntry(entry, accounts, flavorMap) {
      delete entry['manager'];  // this is not needed here
      delete entry['az'];
      if (entry['flavor'] in flavorMap) {
        entry['core'] = parseInt(flavorMap[entry['flavor']]['vcpus']);
      } else {
        entry['core'] = 0;
      }
      entry['cost'] = PRICE * entry['core'];
      angular.extend(entry, accounts[entry['tenant']]);
    };

    // local
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
      saveTo['Grand']['core'] += entry['core'];
      saveTo['Grand']['cost'] += entry['cost'];

      saveTo[level1][level2]['core'] += entry['core'];
      saveTo[level1][level2]['cost'] += entry['cost'];

      saveTo[level1]['Grand']['core'] += entry['core'];
      saveTo[level1]['Grand']['cost'] += entry['cost'];
    };

    return {
      query: function query(startTs, endTs) {
        var deferred = $q.defer(),
          searchHash = util.hashSearch([startTs, endTs]);
        if (Object.keys(totals).length > 0 && searchHash in summaries  && searchHash in totals) {
          deferred.resolve(true);
        } else {
          prepareData(summary(startTs, endTs)).then(function(result) {
            summaries[searchHash] = result['summaries'];
            totals[searchHash] = result['totals'];
            grandTotals[searchHash] = result['grandTotals'];
            deferred.resolve(true);
          }, function(reason) {
              console.log(reason);
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
            if (tmpSummaries[i]['billing'] == orgName) {
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