var MONTHSAYEAR = 12;

define(['app', '../util', 'services/contract', 'options'], function (app, util, contract, options) {
  'use strict';

  /**
   * All nectar usage related data services
   */
  app.factory('TangoCloudService', function (queryResource, $q, AuthService, org, $http) {
    var contractService = contract($http, $q, org, 'tangocloudvm', 'OpenstackProjectID');

    var USAGE_DEFAULT = { core : 0, cost : 0};

    // both summaries and totals has searchHash as the first key
    // summaries: usage data with extended user information
    var summaries = {}, totals = {}, grandTotals = {};

    // get nectar usage between startTs and endTs from local host
    // return a promise
    // local version
    function summary(startTs, endTs) {
      var summaryUrl = 'usage/tango_cloud/TangoCloudUsage_'  + startTs + '_' + endTs + '.json';
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
        util.convertContractPrice(contracts, MONTHSAYEAR);
        return linkUsages(usages, contracts);
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
   function linkUsages(usageSource, contracts) {
      var tmpTotals = {}, extendedUsage = angular.copy(usageSource);
      tmpTotals['Grand'] = angular.copy(USAGE_DEFAULT);

      for (var i = 0; i < usageSource.length; i++) {
        if (extendedUsage[i]['server_id'] in contracts) {
          angular.extend(extendedUsage[i], contracts[extendedUsage[i]['server_id']]);
        } else {
          // set default price to stop calculator blowing itself up
          extendedUsage[i]['unitPrice'] = -1;
        }
        processEntry(extendedUsage[i]);
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
    //   "span": "32",
    //   "server_id": "vm-2141",
    //   "core": "16",
    //   "server": "some.server.ersa.edu.au"
    // },

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

    function processEntry(entry) {
      // span is not used
      entry['cost'] = entry['core'] * entry['unitPrice'];
      if ('managerunit' in entry) {
        entry['organisation'] = entry['managerunit'];
      }
    };

    // local
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
            if (tmpSummaries[i]['biller'] == orgName) {
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