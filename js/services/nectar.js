define(['app', '../util', 'services/contract', 'options' ,'../cloud/services'], function (app, util, contract, options) {
  'use strict';

  /**
   * All nectar usage related data services
   */
  app.factory('NectarService', function (queryResource, $q, AuthService, org, $http, flavor) {
    var contractService = contract($http, $q, org, 'nectar', 'OpenstackID');
    // unitPrice comes from contract, some instances do not have contract with eRSA,
    // so set default price to stop calculator blowing itself up
    var PRICE = 0;
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
      }, function(reason) {
        console.log("Failed to get Nectar usage data. Details: " +  reason);
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
   function linkUsages(usageSource, contracts, flavorMap) {
      var tmpTotals = {}, extendedUsage = angular.copy(usageSource);
      tmpTotals['Grand'] = angular.copy(USAGE_DEFAULT);

      for (var i = 0; i < usageSource.length; i++) {
        if (extendedUsage[i]['tenant'] in contracts) {
          angular.extend(extendedUsage[i], contracts[extendedUsage[i]['tenant']]);
        } else {
          // set default price to stop calculator blowing itself up
          extendedUsage[i]['unitPrice'] = PRICE;
        }
        processEntry(extendedUsage[i], flavorMap);
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
    //   "tenant": "52f03cef4a327e7e842fb898",
    //   "az": "sa",
    //   "image": "d8a5813c-8dd0-49ac-a57f-2fa90b73e0e9",
    //   "span": 385851,
    //   "instance_id": "00ceebc4-1540-48ec-af08-9755d89baef7",
    //   "server": "test-hbase",
    //   "flavor": "885227de-b7ee-42af-a209-2f1ff59bc330",
    //   "server_id": "03f0e40b-106e-4375-bbe2-766102e3201e",
    //   "hypervisor": "some.ersa.org.au",
    //   "manager": [],
    //   "account": "96512e91191aaf4a0dbdc54023c"
    // }

    // New contract/accounts data to be merged with usage data above
    // {
      // "OpenstackID": "6b3dbb8xxxxxxxx5e89cdcebd5865bd17",
      // "unitPrice@OData.Community.Display.V1.FormattedValue": "$0.00",
      // "unit": "School of Civil, Environmental & Mining Engineering",
      // "manager": "Some manager",
      // "biller": "University of Adelaide",
      // "managerid": "e5df8269-xxxx-e611-80e8-c4346bc4beac",
      // "allocated": 4,
      // "name": "CM2 Cloud Services",
      // "salesorderid": "364cfb44-xxxx-e611-80e7-70106fa39b51",
      // "unitPrice": 0,
      // "allocated@OData.Community.Display.V1.FormattedValue": "4",
      // "salesorderdetail2_x002e_transactioncurrencyid": "744fd97c-18fb-e511-80d8-c4346bc5b718",
      // "@odata.etag": "W/\"3233960\""
    // },

    function processEntry(entry, flavorMap) {
      delete entry['az'];
      if (entry['flavor'] in flavorMap) {
        entry['core'] = parseInt(flavorMap[entry['flavor']]['vcpus']);
        entry['flavorName'] = flavorMap[entry['flavor']]['name'];
      } else {
        entry['core'] = 0;
        entry['flavorName'] = 'Unknown';
      }
      entry['cost'] = entry['core'] * entry['unitPrice'];
      // temporary mapping to avoid change templates
      if ('biller' in entry) {
        entry['billing'] = entry['biller'];
      }
      if ('managerunit' in entry) {
        entry['organisation'] = entry['managerunit'];
      }
      if ('unit' in entry) {
        entry['tenant'] = entry['name'];
      }
      entry['full_name'] = entry['manager'];
      delete entry['manager'];  // this is not needed here
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