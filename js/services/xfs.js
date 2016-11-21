define(['app', '../util'], function (app, util) {
  'use strict';

  /**
   * All xfs.filesystem related data services.
   */
  app.factory('XFSService', function (queryResource, $q, org, AuthService) {
    var BASE_URL = sessionStorage['xfs'];

    /**
     * @type {number} BlockPrice
     * @type {number} BlockSize
     */
    var BlockPrice = 5,
      BlockSize = 250;

    // default values of a usage object
    var USAGE_DEFAULT = {
      'usage': 0,
      'blocks': 0,
      'cost': 0
    };

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
          summaries[searchHash] = data;
          deferred.resolve(summaries[searchHash]);
        }, function (rsp) {
          console.log(rsp);
          deferred.reject([]);
        });
      }
      return deferred.promise;
    }

    // get id of a filesystem
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

    function getAccounts() {
      if (AuthService.isAdmin) {
        return org.getAllAccounts();
      } else {
        return org.getUsersOfSync(AuthService.getUserOrgName());
      }
    }

    // convert KiB into GiB
    function processEntry(entry, accounts) {
      entry['raw'] = entry['usage'] * 1024;
      entry['usage'] = util.toGB(entry['raw']);
      entry['blocks'] = Math.ceil(entry['usage'] / BlockSize);
      entry['cost'] = BlockPrice * entry['blocks'];
      angular.extend(entry, accounts[entry['owner']]);
    }

    /**
     * @typedef {object} Entry
     * @property {number} usage
     * @property {string} owner   Username, onwer of a home directory
     * @property {string} billing   User's billing organisation
     * @property {number} organisation   User's most detailed organisation
     * @property {number} blocks  Usage devided by BlockSize.
     * @property {number} cost    BlockPrice * BlockSize
     * @param {entry} Entry
     */
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
    function processUsages(usageSource, accounts, searchHash) {
      var tmpTotals = {};
      tmpTotals['Grand'] = angular.copy(USAGE_DEFAULT);
      // totals at different levels: organisation (billing) and school (organisation)
      summaries[searchHash] = angular.copy(usageSource);

      for (var i = 0; i < summaries[searchHash].length; i++) {
        processEntry(summaries[searchHash][i], accounts);
        subtotal(summaries[searchHash][i], tmpTotals);
      }
      grandTotals[searchHash] = tmpTotals['Grand'];
      delete tmpTotals['Grand'];

      totals[searchHash] = tmpTotals;
    }

    return {
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
              processUsages(usages, getAccounts(), searchHash);
              deferred.resolve(true);
            }, function(reason) {
              console.log(reason);
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
            if (tmpSummaries[i]['billing'] == orgName) {
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
        return grandTotals[util.hashSearch[fileSystemId, startTs, endTs]];
      }
    };
  });
});