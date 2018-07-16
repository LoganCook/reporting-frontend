define(["app", "../util", "services/storage.v2"], function (app, util) {

  app.controller("AAllocationSummaryController",
    ["$scope", "spinner", "AuthService", "StorageService", "theConstants", function ($scope, spinner, AuthService, StorageService, theConstants) {
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
      $scope.datepickerOptions = {minMode: 'month'};
      $scope.isFilterApplied = theConstants.isFilterApplied;
      $scope.isLoadTriggeredAtLeastOnce = false;
      $scope.orderBy = theConstants.orderByPredicateThenSubTotal;
      $scope.orderByTwoCols = theConstants.orderByTwoCols;
      $scope.isSubTotalRow = theConstants.isSubTotalRow;

      $scope.load = function () {
        spinner.start();
        $scope.isLoadTriggeredAtLeastOnce = true;
        $scope.rangeStart = util.firstDayOfYearAndMonth($scope.rangeEnd);
        $scope.rangeEnd = util.lastDayOfYearAndMonth($scope.rangeEnd);

        var startTs = util.dayStart($scope.rangeStart), endTs = util.dayEnd($scope.rangeEnd);
        var orgName;
        if (!(AuthService.isAdmin())) {
          orgName = AuthService.getUserOrgName();
        }
        $scope.usages = [];
        $scope.subTotals = [];
        $scope.rollup = [];
        $scope.total = {
          'usage': 0,
          'blocks': 0,
          'cost': 0
        };

        StorageService.query(startTs, endTs).then(function() {
          $scope.usages = StorageService.getUsages(startTs, endTs, orgName);
          $scope.rollup = StorageService.getUserRollup(startTs, endTs);
          $scope.rollupErrors = StorageService.getUserRollupErrorData(startTs, endTs);
          if (orgName) {
            var subTotals = angular.copy(StorageService.getSubTotals(startTs, endTs, orgName));
            $scope.grandTotal = util.spliceOne(subTotals, 'organisation', 'Grand');
            $scope.subTotals = subTotals;
          } else {
            $scope.subTotals = StorageService.getSubTotals(startTs, endTs);
            $scope.grandTotal = StorageService.getGrandTotal(startTs, endTs);
          }
          spinner.stop();
        }, function (reason) {
          spinner.stop();
          throw new Error('Problem getting HPC information: ' + reason);
        });
      };
    }
  ]);
});