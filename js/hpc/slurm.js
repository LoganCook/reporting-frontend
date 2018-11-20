define(
  ["app", "lodash", "../util", "../util2", "options", "services/slurm"],
  function (app, _, utilOld, util, options) {

  app.controller("SlurmController", ["$scope", "$filter", "theConstants", "org", "spinner", "AuthService","SlurmService",
    function ($scope, $filter, theConstants, $timeoutorg, spinner, AuthService, SlurmService) {
      var orgName = null;
      if (!(AuthService.isAdmin())) {
        orgName = AuthService.getUserOrgName();
      }
      $scope.values = _.values;
      $scope.formatNumber = utilOld.formatNumber;
      $scope.viewDetails = false;
      $scope.datepickerOptions = {minMode: 'month'};
      $scope.rangeStart = new Date();
      $scope.rangeEnd = new Date();
      $scope.rangeEndOpen = false;
      $scope.openRangeEnd = function () {
        $scope.rangeEndOpen = true;
      };
      $scope.isSubTotalRow = theConstants.isSubTotalRow;
      $scope.subTotalRowIndicator = 'unit';
      $scope.isFilterApplied = theConstants.isFilterApplied;
      $scope.orderByNCols = theConstants.orderByNCols;
      $scope.orderBy = theConstants.orderByPredicateThenSubTotal;

      $scope.load = function () {
        $scope.alerts = [];
        if (util.withinCurrentMonth($scope.rangeEnd)) {
          $scope.alerts.push({msg: options['hpc']['IncompleteMonth']});
        }

        $scope.rangeStart = utilOld.firstDayOfYearAndMonth($scope.rangeEnd);
        $scope.rangeEnd = utilOld.lastDayOfYearAndMonth($scope.rangeEnd);

        var startTs = utilOld.dayStart($scope.rangeStart);
        var endTs = utilOld.dayEnd($scope.rangeEnd);
        spinner.start();
        SlurmService.query(startTs, endTs).then(function() {
          $scope.jobCounts = SlurmService.getUsages(startTs, endTs, orgName);
          if (orgName) {
            var subTotals = angular.copy(SlurmService.getSubTotals(startTs, endTs, orgName));
            $scope.grandTotal = utilOld.spliceOne(subTotals, 'unit', 'Grand');
            $scope.subTotals = subTotals;
          } else {
            $scope.userRollup = SlurmService.getUserRollup(startTs, endTs);
            $scope.userRollupErrorData = SlurmService.getUserRollupErrorData(startTs, endTs);
            $scope.subTotals = SlurmService.getSubTotals(startTs, endTs);
            $scope.grandTotal = SlurmService.getGrandTotal(startTs, endTs);
            console.log($scope.jobCounts);
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
