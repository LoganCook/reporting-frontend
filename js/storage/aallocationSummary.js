define(
  ["app", "lodash", "../util", "../countdown-latch", "properties", "../services/allocationSummary-rollup", "services/xfs.usage", "services/hnas.vv", "services/hnas.fs", "services/hcp"],
  function (app, _, util, countdownLatch, props, rollup) {

  app.controller("AAllocationSummaryController",
    ["$rootScope", "$scope", "$timeout", "$q", "$filter", "reporting", "org", "spinner", "AuthService", "RDService", "XFSUsageService", "HNASVVService",
      "HNASFSService", "HCPService", "theConstants", "$uibModal",
    function ($rootScope, $scope, $timeout, $q, $filter, reporting, org, spinner, AuthService, RDService, XFSUsageService, HNASVVService,
      HNASFSService, HCPService, theConstants, $uibModal) {

      $scope.formatSize = util.formatSize;
      $scope.formatTimestamp = util.formatTimeSecStamp;
      $scope.formatNumber = util.formatNumber;
      $scope.formatDuration = util.formatDuration;

      $scope.alerts = [];
      $scope.usages = [];
      $scope.total = {};

      $scope.rangeStart = new Date();
      $scope.rangeEnd = new Date();
      $scope.rangeEndOpen = false;
      $scope.openRangeEnd = function () {
        $scope.rangeEndOpen = true;
      };
      $scope.datepickerOptions = {minMode: 'month'}
      function isFilterApplied (displayed, raw) {
        return displayed && raw && displayed.length !== raw.length
      }
      $scope.isFilterAppliedSimple = () => {
        return isFilterApplied($scope.displayedSimpleRows, $scope.subTotals)
      }
      $scope.isFilterAppliedRollup = () => {
        return isFilterApplied($scope.displayedRollupRows, $scope.rollup)
      }
      $scope.isFilterAppliedDetailed = () => {
        return isFilterApplied($scope.displayedUsagesRows, $scope.usages)
      }
      $scope.orderBy = theConstants.orderByPredicateThenSubTotal
      $scope.orderByTwoCols = function (col1, col2) {
        return (value) => {
          return value[col1] + value[col2]
        }
      }
      $scope.isSubTotalRow = theConstants.isSubTotalRow
      $scope.showBlacklist = function() {
        var modalInstance = $uibModal.open({
          ariaLabelledBy: 'modal-title',
          ariaDescribedBy: 'modal-body',
          templateUrl: 'blacklistModal.html',
          controller: function($scope) {
            $scope.items = props["filesystem.blacklist"]
          },
          size: 'md'
      })}
      $scope.showWhitelist = function() {
        var modalInstance = $uibModal.open({
          ariaLabelledBy: 'modal-title',
          ariaDescribedBy: 'modal-body',
          templateUrl: 'whitelistModal.html',
          controller: function($scope) {
            $scope.items = props["hcp.namespace.whitelist"]
          },
          size: 'md'
      })}
      $scope.isLoadTriggeredAtLeastOnce = false

      function addServiceTotal(serviceTotal, subTotals) {
        var k1 = 'billing', k2 = 'organisation';
        var totalMap = util.inflate(serviceTotal, k1, k2),
          gTotalMap = util.inflate(subTotals, k1, k2); // inflate totals
        var level1, level2;
        for (level1 in totalMap) {
          if (!(level1 in gTotalMap)) {
            gTotalMap[level1] = {};
          }
          for (level2 in totalMap[level1]) {
            if (level2 in gTotalMap[level1]) {
              gTotalMap[level1][level2]['usage'] += totalMap[level1][level2]['usage'];
              gTotalMap[level1][level2]['blocks'] += totalMap[level1][level2]['blocks'];
              gTotalMap[level1][level2]['cost'] += totalMap[level1][level2]['cost'];
            } else {
              gTotalMap[level1][level2] = totalMap[level1][level2];
            }
          }
        }
        return util.deflate(gTotalMap, k1, k2);
      }

      function updateGrandTotal(newTotal, currentTotal) {
        var fields = ['usage', 'blocks', 'cost'], l = fields.length, i = 0;
        for (i; i < l; i++) {
          currentTotal[fields[i]] += newTotal[fields[i]];
        }
      }

      $scope.disableBlacklistChangeHandler = function () {
        if ($scope.isLoadTriggeredAtLeastOnce === false) {
          return
        }
        $scope.load()
      }

      $scope.load = function () {
        spinner.start();
        $scope.isLoadTriggeredAtLeastOnce = true
        $scope.rangeStart = util.firstDayOfYearAndMonth($scope.rangeEnd);
        $scope.rangeEnd = util.lastDayOfYearAndMonth($scope.rangeEnd);

        var startTs = util.dayStart($scope.rangeStart);
        var endTs = util.dayEnd($scope.rangeEnd);
        var isDisableBlacklist = typeof $scope.isDisableBlacklist === 'undefined' ? false : $scope.isDisableBlacklist
        var orgName;
        if (!(AuthService.isAdmin())) {
          orgName = AuthService.getUserOrgName();
        }
        $scope.usages = []
        $scope.subTotals = []
        $scope.rollup = []
        $scope.total = {
          'usage': 0,
          'blocks': 0,
          'cost': 0
        }

        var numberOfServiceCalls = 4
        var latch = new countdownLatch(numberOfServiceCalls)
        latch.await(function() {
          try {
            var rollupResponse = rollup.createUserRollup($scope.usages)
            $scope.rollup = rollupResponse.rollupResult
            $scope.isAllRollupSuccess = rollupResponse.isAllSuccess
            $scope.rollupErrors = rollupResponse.errors
          } finally {
            spinner.stop()
          }
        })
        function doCall (service) {
          service.query(startTs, endTs, isDisableBlacklist).then(function() {
            $scope.usages = $scope.usages.concat(service.getUsages(startTs, endTs, orgName, isDisableBlacklist))
            $scope.subTotals = addServiceTotal(service.getTotals(startTs, endTs, orgName, isDisableBlacklist), $scope.subTotals)
            updateGrandTotal(service.getGrandTotals(startTs, endTs, isDisableBlacklist), $scope.total)
            latch.countDown()
          }, function(reason) {
            latch.countDown()
            console.error("Failed request, ", reason)
          })
        }
        doCall(XFSUsageService)
        doCall(HNASVVService)
        doCall(HNASFSService)
        doCall(HCPService)
      }
    }
  ]);
});