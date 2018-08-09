define(['app', '../util', 'services/contract', 'properties'], function (app, util, contract, props) {
  'use strict';

  /**
   * All xfs.filesystem related data services. Currently only used by hpc home storage
   */
  app.factory('XFSService', function (queryResource, $http, $q, org, AuthService) {
    var contractService = contract($http, $q, org, 'ersaaccount', 'managerusername', AuthService);
    var BASE_URL = sessionStorage['xfs'];

    /**
     * @type {number} BlockPrice
     * @type {number} BlockSize
     */
    // FIXME: There is no hpc home storage contracts but surrogate contracts eRSAAccount
    // FIXME: this is a singleton service, all the states
    // are shared by every controllers use this service
    var BlockSize = 250, BlockPrice = 5000, // make BlockPrice significant as it should not be used.
      useContractPrice = false;  // unitPrice DOES NOT come from contracts

    // default values of a usage object
    var USAGE_DEFAULT = {
      'usage': 0,
      'blocks': 0,
      'cost': 0
    };

    /**
     * Crete a callback function for Array.filter to blacklist items
     *
     * @param {string} fileSystemName
     * @returns function
     */
    function createBlacklistFilterCallback(fileSystemName) {
      return function removeThese(item) {
        return props[fileSystemName]['blacklist'].indexOf(item['owner']) === -1;
      };
    }

    var nq = queryResource.build(BASE_URL);
    var filesystems = {}, fCount = 0;
    // both summaries and totals has searchHash as the first key
    // summaries: usage data with extended user information
    var summaries = {}, totals = {}, grandTotals = {};

    function hashSearch(fileSystemId, startTs, endTs) {
      return fileSystemId + startTs + endTs;
    }

    // list filesystems. Each filesystem has three keys: id, host, name
    function list() {
      var deferred = $q.defer();
      if (Object.keys(filesystems).length) {
        deferred.resolve(filesystems);
      } else {
        nq.query({object: 'filesystem'}, function (data) {
          filesystems = data;
          fCount = filesystems.length;
          deferred.resolve(filesystems);
        }, function (rsp) {
          alert("Data could not be retrieved. Please try it later.");
          console.log(rsp);
          deferred.reject({});
        });
      }
      return deferred.promise;
    }

    // get a summary of a filesystem between startTs and endTs
    function summary(fileSystemId, startTs, endTs) {
      console.warn("Attention: useContractPrice = ", useContractPrice);
      var deferred = $q.defer(),
        searchHash = hashSearch(fileSystemId, startTs, endTs);
      if (!angular.isString(fileSystemId)) {
        // No fileSystemId, return back empty array
        deferred.resolve([]);
      } else if (Object.keys(summaries).length > 0 && searchHash in summaries) {
        deferred.resolve(summaries[searchHash]);
      } else {
        var args = {
          object: 'filesystem',
          id: fileSystemId,
          method: 'summary',
          start: startTs,
          end: endTs
        };
        nq.query(args, function (data) {
          var fileSystemName = getNameOf(fileSystemId);
          if (fileSystemName in props && 'blacklist' in props[fileSystemName]) {
            var removeThese = createBlacklistFilterCallback(fileSystemName);
            summaries[searchHash] = data.filter(removeThese);
          } else {
            summaries[searchHash] = data;
          }
          deferred.resolve(summaries[searchHash]);
        }, function (rsp) {
          console.log(rsp);
          deferred.reject([]);
        });
      }
      return deferred.promise;
    }

    // get id of a filesystem by searching name
    function getIdOf(name) {
      // use computing power instead of memory
      var id = null;
      for (var i = 0; i < fCount; i++ ) {
        if (filesystems[i]['name'].indexOf(name) > -1) {
          id = filesystems[i]['id'];
          break;
        }
      }
      return id;
    }

    // get name of a filesystem by searching id
    // only return the last part if it is a full path
    // otherwise, whole name
    function getNameOf(id) {
      for (var i = 0; i < fCount; i++ ) {
        if (filesystems[i]['id'] === id) {
          var name = filesystems[i]['name'].split('/');
          var namePartCount = name.length;
          return name[namePartCount - 1];
        }
      }
      return null;
    }

    function computeBlocks(gbUsed) {
      var isUnderChargableThreshold = gbUsed < 1 && Math.round(gbUsed) === 0;
      if (isUnderChargableThreshold) {
        return 0;
      }
      return Math.ceil(gbUsed / BlockSize);
    }

    // convert KiB into GiB
    function processEntry(entry) {
      entry['raw'] = entry['usage'] * 1024;
      entry['usage'] = util.toGB(entry['raw']);
      entry['blocks'] = computeBlocks(entry['usage']);
      entry['cost'] = entry['blocks'] * entry['unitPrice'];
    }

    /**
     * @typedef {object} Entry
     * @property {number} usage
     * @property {string} owner   Username, onwer of a home directory
     * @property {string} biller   User's billing organisation
     * @property {number} managerunit   User's most detailed organisation, used to be organisation
     * @property {number} blocks  Usage devided by BlockSize.
     * @property {number} cost    BlockPrice * BlockSize
     * @param {entry} Entry
     */
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

      saveTo['Grand']['usage'] = saveTo['Grand']['usage'] + entry['usage'];
      saveTo['Grand']['blocks'] += entry['blocks'];
      saveTo['Grand']['cost'] += entry['cost'];

      saveTo[level1][level2]['usage'] = saveTo[level1][level2]['usage'] + entry['usage'];
      saveTo[level1][level2]['blocks'] += entry['blocks'];
      saveTo[level1][level2]['cost'] += entry['cost'];

      saveTo[level1]['Grand']['usage'] += entry['usage'];
      saveTo[level1]['Grand']['blocks'] += entry['blocks'];
      saveTo[level1]['Grand']['cost'] += entry['cost'];
    }

    // link usage to users
    // saveTo is totals[searchHash]
    function processUsages(usageSource, contracts, searchHash) {
      var tmpTotals = {};
      tmpTotals['Grand'] = angular.copy(USAGE_DEFAULT);
      // totals at different levels: organisation (billing) and school (organisation)
      summaries[searchHash] = angular.copy(usageSource);

      for (var i = 0; i < summaries[searchHash].length; i++) {
        // NOTE: this is special treat to hpc home storage price
        if (summaries[searchHash][i]['owner'] in contracts) {
          angular.extend(summaries[searchHash][i], contracts[summaries[searchHash][i]['owner']]);
        }
        if (!useContractPrice) {
          summaries[searchHash][i]['unitPrice'] = BlockPrice;
        }
        processEntry(summaries[searchHash][i]);
        subtotal(summaries[searchHash][i], tmpTotals);
      }
      grandTotals[searchHash] = tmpTotals['Grand'];
      delete tmpTotals['Grand'];

      totals[searchHash] = tmpTotals;
    }

    return {
      isLastReportMonth: function (currentDate, lastMonth) {
      /**
       * * @description
       * check if currentDate is beyond the set last report month
       *
       * @property {Date} currentDate
       * @property {Object} lastMonth   object has date and message keys
       * @returns {boolean} true if currentDate is beyond last report month
       */
        if (currentDate > lastMonth['date']) {
          alert(lastMonth['message']);
          return true;
        }
        return false;
      },
      loadPrice: function loadPrice(price) {
        // This is a special fix for HPC home storage by loading price from options
        // See comment at the top of the file
        BlockPrice = price;
      },
      getIdOf: getIdOf,
      list: list,
      query: function query(fileSystemId, startTs, endTs) {
        var deferred = $q.defer(),
          searchHash = hashSearch(fileSystemId, startTs, endTs);
        if (Object.keys(totals).length > 0 && searchHash in summaries  && searchHash in totals) {
          deferred.resolve(true);
        } else {
          summary(fileSystemId, startTs, endTs)
            .then(function(usages) {
              contractService.getContracts().then(function(contracts) {
                processUsages(usages, contracts, searchHash);
                deferred.resolve(true);
              });
            }, function(reason) {
              console.error(reason);
              deferred.reject(false);
            });
        }
        return deferred.promise;
      },
      getUsages: function getUsages(fileSystemId, startTs, endTs, orgName) {
        var tmpSummaries = util.getCached(summaries, [fileSystemId, startTs, endTs]);
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
      getTotals: function getTotals(fileSystemId, startTs, endTs, orgName) {
        return util.rearrange(util.getCached(totals, [fileSystemId, startTs, endTs], orgName));
      },
      getGrandTotals: function getTotals(fileSystemId, startTs, endTs) {
        // only for admin view
        return grandTotals[util.hashSearch([fileSystemId, startTs, endTs])];
      }
    };
  });
});
