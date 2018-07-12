var MONTHSAYEAR = 12;

define(['app', '../util', 'services/contract'], function (app, util, contract) {
  'use strict';

  // Need to separate admin and other because they get data from different urls:
  // admin/vms/instance?start=&end=
  // manager/vms/instance?start=&end=email=
  // vms/instance?start=&end=email=
  /**
   * All Tango Cloud usage related data services
   */
  app.factory('TangoCloudService', function (queryResource, $q, AuthService, org, $http, compositions, pricelist) {
    // Check if the product - tangocloudvm is a composed product and if so gets prices
    var composedProducts = {}, prices = {}, isComposed = false;

    // var contractService = contract($http, $q, org, 'tangocloudvm', 'OpenstackProjectID');
    // var nq = queryResource.build(sessionStorage['vms']);

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
      // // composed product could have effective date
      // composedProducts = compositions('tangocloudvm');
      // if (Object.keys(composedProducts).length > 0) {
      //   if ('start-date' in composedProducts && composedProducts['start-date'] > startTs && composedProducts['start-date'] < endTs) {
      //     throw new Error("Start of price effective time range is in the middle billing start date: " +
      //                     String(composedProducts['start-date']) + " vs " + String(startTs) + " - " + String(endTs));
      //   }
      //   if ('end-date' in composedProducts && composedProducts['end-date'] > startTs && composedProducts['end-date'] < endTs) {
      //   // if there is no start-date but end-date, it will throw error, someone has configured wrongly
      //     throw new Error("Billing period is not fully covered by price effective time range: " +
      //                     String(startTs) + " " + String(endTs) +
      //                     " vs " + String(composedProducts['start-date']) + " " + String(composedProducts['end-date']));
      //   }
      //   // Check if it is in the price effective range
      //   if (('end-date' in composedProducts && startTs >= composedProducts['start-date'] && endTs <= composedProducts['end-date']) ||
      //       (!('end-date' in composedProducts) && startTs >= composedProducts['start-date'])) {
      //     isComposed = true;
      //     Object.keys(composedProducts).forEach(item => {
      //       if (!item.endsWith('-date')) {
      //         pricelist(composedProducts[item]).then(function (data) {
      //           prices[item] = util.keyArray(data, '_pricelevelid_value');
      //           console.log(prices[item]);
      //         });
      //       }
      //     });
      //   } else {
      //     isComposed = false;
      //   }
      // } else {
      //   isComposed = false;
      // }

      // return nq.query(args).$promise;
    }

    // // common
    // function prepareData(queryPromise) {
    //   return queryPromise.then(function (usages) {
    //     return processUsages(usages);
    //   });
    // }

    // // common
    // function processUsages(usages) {
    //   return getContracts().then(function (contracts) {
    //     util.convertContractPrice(contracts, MONTHSAYEAR);
    //     return linkUsages(usages, contracts);
    //   }, function(reason) {
    //     console.log("Failed to get Tango Cloud usage data. Details: " +  reason);
    //   });
    // };
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

  // // Need to separate admin and other because they get data from different urls:
  // // admin/vms/instance?start=&end=
  // // manager/vms/instance?start=&end=email=
  // // vms/instance?start=&end=email=
  //   // common
  //   function getContracts() {
  //     var promise;
  //     if (AuthService.isAdmin()) {
  //       // admin/vms/instance?start=&end=
  //       promise = contractService.getAll();
  //     } else {
  //       var email = AuthService.getUserEmail();
  //       // Manager at different levels.
  //       // manager/vms/instance?start=&end=email=
  //       // vms/instance?start=&end=email=

  //       promise = contractService.getServiceOf(org.getOrganisationId(AuthService.getUserOrgName()));
  //     }
  //     return promise;
  //   };

    // link usage to users
    // saveTo is totals[searchHash]
    // common + local argument
  //  function linkUsages(usageSource, contracts) {
  //     var tmpTotals = {}, extendedUsage = angular.copy(usageSource);
  //     tmpTotals['Grand'] = angular.copy(USAGE_DEFAULT);

  //     for (var i = 0; i < usageSource.length; i++) {
  //       if (extendedUsage[i]['id'] in contracts) {
  //         angular.extend(extendedUsage[i], contracts[extendedUsage[i]['id']]);
  //       } else {
  //         // set default price to stop calculator blowing itself up
  //         extendedUsage[i]['unitPrice'] = -1;
  //       }
  //       if (isComposed) {
  //         processComposedEntry(extendedUsage[i], prices);
  //       } else {
  //         processEntry(extendedUsage[i]);
  //       }
  //       subtotal(extendedUsage[i], tmpTotals);
  //     }
  //     var grandTotal = tmpTotals['Grand'];
  //     delete tmpTotals['Grand'];

  //     return {
  //       summaries: extendedUsage,
  //       totals: tmpTotals,
  //       grandTotals: grandTotal
  //       };
  //   };

    // {
    //   "id": "vm-2141",
    //   "server": "some.server.ersa.edu.au",
    //   "core": 16,
    //   "ram": 32,
    //   "storage": 34.000
    //   "os": "ubuntu",
    //   "businessUnit": "UofA",
    //   "span": 32,
    //   "uptimePercent": 99.99999
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
      // "os": "Ubuntu Linux (64-bit)"
      // "salesorderid": "364cfb44-xxxx-e611-80e7-70106fa39b51",
      // "unitPrice": 0,
      // "allocated@OData.Community.Display.V1.FormattedValue": "4",
      // "salesorderdetail2_x002e_transactioncurrencyid": "744fd97c-18fb-e511-80d8-c4346bc5b718",
      // "pricelevelID": "0c407dd9-1b59-e611-80e2-c4346bc58784"
      // "@odata.etag": "W/\"3233960\""
    // },
    // function processEntry(entry) {
    //   // entry is for monthly only
    //   // span is not used, its unit is hour
    //   entry['cost'] = entry['core'] * entry['unitPrice'];
    //   if ('managerunit' in entry) {
    //     entry['organisation'] = entry['managerunit'];
    //   }
    // };

    // function processComposedEntry(entry) {
    //   // entry is for monthly only
    //   // span is not used, its unit is hour
    //   // storage calculation depends on type of os
    //   entry['cost'] = 0;
    //   if ('pricelevelID' in entry) {
    //     Object.keys(prices).forEach(element => {
    //       try {
    //         entry['cost'] += entry[element] * prices[element][entry['pricelevelID']]['amount'];
    //       } catch (error) {
    //         console.error("Calculating ", element, " cost error: ", error.message);
    //       }
    //     });
    //   }

    //   if ('managerunit' in entry) {
    //     entry['organisation'] = entry['managerunit'];
    //   }
    // };

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
            console.log(reason);
            alert("No data is available for this period.");
            deferred.reject(false);
          });
          // processUsages(summary(startTs, endTs)).then(function(result) {
          //   summaries[searchHash] = result['summaries'];
          //   totals[searchHash] = result['totals'];
          //   grandTotals[searchHash] = result['grandTotals'];
          //   deferred.resolve(true);
          // }, function(reason) {
          //     console.log(reason);
          //     alert("No data is available for this period.");
          //     deferred.reject(false);
          // });
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