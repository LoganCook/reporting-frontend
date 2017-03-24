define(['app', 'properties', 'services/rds'], function (app, props) {
  'use strict';

  // default values of a usage object
  var USAGE_DEFAULT = {
    'usage': 0,
    'blocks': 0,
    'cost': 0
  };

  /* This is for RDS allocation or XFS queries
   * With RDS allocation, no matter vv or fs, query RDS with either virtual-volume or filesystem
   * With XFS, probably owner -> accounts
   */
  function Storage (endpoint, queryResource, AuthService, org, RDService) {
    /**
     * @type {number} BlockPrice
     * @type {number} BlockSize
     */
    this.BlockSize = 250;

    this.nq = queryResource.build(endpoint);

    // every derived class should have these functions of their own
    this.query = function(startTs, endTs) { throw "Not implemented."; };
    this.processEntry = function() { throw "Not implemented."; };
    this.getUsages = function() { throw "Not implemented."; };
    this.getTotals = function() { throw "Not implemented."; };
    // getGrandTotals only availabel to admin
    this.getGrandTotals = function() { throw "Not implemented."; };

    // for xfs, eRSA accounts are returned with usage data
    this.getAccounts = function () {
      if (AuthService.isAdmin()) {
        return org.getAllAccounts();
      } else {
        return org.getUsersOfSync(AuthService.getUserOrgName());
      }
    };

    // Get allocation information from RDService
    this.getAllocations = function() {
      var promise;
      if (AuthService.isAdmin()) {
        promise = RDService.getAll();
      } else {
        promise = RDService.getServiceOf(org.getOrganisationId(AuthService.getUserOrgName()));
      }
      return promise;
    };

    // link usage to users
    // saveTo is totals[searchHash]
    this.linkUsages = function(usageSource, accounts) {
      var tmpTotals = {}, extendedUsage = angular.copy(usageSource);
      tmpTotals['Grand'] = angular.copy(USAGE_DEFAULT);

      for (var i = 0; i < usageSource.length; i++) {
        this.processEntry(extendedUsage[i], accounts);
        this.subtotal(extendedUsage[i], tmpTotals);
      }
      var grandTotals = tmpTotals['Grand'];
      delete tmpTotals['Grand'];

      return { summaries: extendedUsage,
        totals: tmpTotals,
        grandTotals: grandTotals
        };
    };

    this.processUsages = function(usages) {
      var self = this;
      return self.getAllocations().then(function (allocations) {
        return self.linkUsages(usages, allocations);
      });
    };

    this.prepareData = function(queryPromise, isDisableBlacklist) {
      var self = this;
      return queryPromise.then(function (usages) {
        if (isDisableBlacklist) {
          return self.processUsages(usages);
        }
        var blacklist = props["filesystem.blacklist"]
        var filteredUsages = usages.filter(function(element) {
          var isFilesystemBlacklisted = 'filesystem' in element && blacklist.indexOf(element.filesystem) !== -1
          return !isFilesystemBlacklisted
        })
        return self.processUsages(filteredUsages);
      });
    };

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
    this.subtotal = function(entry, saveTo) {
      var level1 = 'billing' in entry ? entry['billing'] : '?',
        level2 = 'organisation' in entry ? entry['organisation'] : '?';
      if (!(level1 in saveTo)) {
        saveTo[level1] = {};
        saveTo[level1]['Grand'] = angular.copy(USAGE_DEFAULT);
      }
      if (!(level2 in saveTo[level1])) {
        saveTo[level1][level2] = angular.copy(USAGE_DEFAULT);
      }
      if ('live_usage' in entry) {
        saveTo['Grand']['usage'] = saveTo['Grand']['usage'] + entry['live_usage'];
      } else {
        saveTo['Grand']['usage'] = saveTo['Grand']['usage'] + entry['usage'];
      }
      saveTo['Grand']['blocks'] += entry['blocks'];
      saveTo['Grand']['cost'] += entry['cost'];

      saveTo[level1][level2]['usage'] = saveTo[level1][level2]['usage'] + entry['usage'];
      saveTo[level1][level2]['blocks'] += entry['blocks'];
      saveTo[level1][level2]['cost'] += entry['cost'];

      saveTo[level1]['Grand']['usage'] += entry['usage'];
      saveTo[level1]['Grand']['blocks'] += entry['blocks'];
      saveTo[level1]['Grand']['cost'] += entry['cost'];
    };

  }

  app.factory('Storage', function(queryResource, AuthService, org, RDService) {
    return function constructor(endpoint) {
      return new Storage(endpoint, queryResource, AuthService, org, RDService);
    };
  });
});