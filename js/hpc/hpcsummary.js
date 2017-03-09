define(["app", "lodash", "../util", "../util2", 'options', 'services/hpc'], function (app, _, utilOld, util, options) {
  app.controller("HPCSummaryController", ["$scope", "$filter", "theConstants", "org", "spinner", "AuthService","HPCService",
    function ($scope, $filter, theConstants, $timeoutorg, spinner, AuthService, HPCService) {
      var orgName;
      if (!(AuthService.isAdmin())) {
        orgName = AuthService.getUserOrgName();
      }

      $scope.values = _.values;
      $scope.formatNumber = utilOld.formatNumber;
      $scope.viewDetails = false
      $scope.rangeStart = new Date();
      $scope.rangeEnd = new Date();
      $scope.rangeEndOpen = false;
      $scope.openRangeEnd = function () {
        $scope.rangeEndOpen = true;
      };
      $scope.headersWithoutDetails = ["Organisation", "School", "Job Count", "Core Hours", "Fee"]
      $scope.headersWithDetails = ["Organisation", "School", "User ID", "User Name", "Email", "Queue", "Job Count", "Core Hours", "Fee"]

      var noDetailsStrategy = function() {
        var result = []
        result.push($scope.headersWithoutDetails)
        var sorted = $filter('orderBy')($scope.subTotals, ['billing','organisation','job_count'])
        _.forEach(sorted, function (summary) {
          result.push([
            summary.billing,
            summary.organisation,
            summary.job_count,
            $scope.formatNumber(summary.hours),
            $scope.formatNumber(summary.cost)
          ])
        })
        result.push([
          theConstants.grandTotal,
          '',
          $scope.grandTotal.job_count,
          $scope.formatNumber($scope.grandTotal.hours),
          $scope.formatNumber($scope.grandTotal.cost)
        ])
        return result
      }

      var detailsStrategy = function() {
        var result = []
        result.push($scope.headersWithDetails)
        var sorted = $filter('orderBy')($scope.jobCounts, ['billing','organisation','job_count'])
        _.forEach(sorted, function (summary) {
          result.push([
            summary.billing,
            summary.organisation,
            summary.owner,
            summary.fullname,
            summary.email,
            summary.queue,
            summary.job_count,
            $scope.formatNumber(summary.hours),
            $scope.formatNumber(summary.cost)
          ]);
        });
        result.push([
          theConstants.grandTotal,
          '',
          '',
          '',
          '',
          '',
          $scope.grandTotal.job_count,
          $scope.formatNumber($scope.grandTotal.hours),
          $scope.formatNumber($scope.grandTotal.cost)
        ])
        return result
      }

      /**
       * create CSV file data with summary data that has already fetched and stored.
       *
       * @export
       * @return{Array} an array (lines) of arrays (columns) representing a CSV file
       */
      $scope.export = function () {
        if ($scope.viewDetails) {
          return detailsStrategy()
        }
        return noDetailsStrategy()
      };

      $scope.load = function () {
        $scope.alerts = [];
        if (util.withinCurrentMonth($scope.rangeEnd)) {
          $scope.alerts.push({msg: options['hpc']['IncompleteMonth']});
        }

        $scope.rangeStart = utilOld.firstDayOfYearAndMonth($scope.rangeEnd);
        $scope.rangeEnd = utilOld.lastDayOfYearAndMonth($scope.rangeEnd);

        var startTs = utilOld.dayStart($scope.rangeStart);
        var endTs = utilOld.dayEnd($scope.rangeEnd);

        HPCService.query(startTs, endTs).then(function() {
          $scope.jobCounts = HPCService.getJobCounts(startTs, endTs, orgName);
          if (orgName) {
            var subTotals = angular.copy(HPCService.getSubTotals(startTs, endTs, orgName));
            $scope.grandTotal = utilOld.spliceOne(subTotals, 'organisation', 'Grand');
            $scope.subTotals = subTotals;
          } else {
            $scope.subTotals = HPCService.getSubTotals(startTs, endTs);
            $scope.grandTotal = HPCService.getGrandTotal(startTs, endTs);
          }
        });
      };
    }
  ]);
});