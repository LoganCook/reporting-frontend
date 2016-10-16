define(["app", "lodash", "../util", "../util2", 'options', 'services/hpc'], function (app, _, utilOld, util, options) {
  app.controller("HPCSummaryController", ["$scope",  "org", "spinner", "AuthService","HPCService",
    function ($scope, $timeoutorg, spinner, AuthService, HPCService) {
      var orgName;
      if (!(AuthService.isAdmin())) {
        orgName = AuthService.getUserOrgName();
      }

      $scope.values = _.values;
      $scope.formatNumber = utilOld.formatNumber;

      $scope.rangeStart = new Date();
      $scope.rangeEnd = new Date();
      $scope.rangeEndOpen = false;
      $scope.openRangeEnd = function () {
        $scope.rangeEndOpen = true;
      };

      /**
       * create TSV file data with summary data that has already fetched and stored.
       *
       * @export
       * @return{Array} data
       */
      $scope.export = function () {
        var data = [];

        if ($scope.loggedInAsErsaUser) {
          data = [
            ["Organisation", "School", "User ID", "User Name", "Email", "Job Count", "Total Core Hours", "$"]
          ];

          _.forEach($scope.jobSummary, function (summary) {
            data.push([
              summary.billingName,
              summary.organisation,
              summary.username,
              summary.fullname,
              summary.email,
              $scope.formatNumber(summary.jobCount),
              $scope.formatNumber(summary.cpuSeconds / 3600),
              summary.cost
            ]);
          });

          /** Grand total data. */
          data.push([
            'Grand Total',
            ' - ',
            ' - ',
            ' - ',
            ' - ',
            $scope.formatNumber($scope.jobCountSum),
            $scope.formatNumber($scope.cpuSecondsSum / 3600),
            $scope.costSum
          ]);
        } else {
          data = [
            ["School", "User ID", "User Name", "Email", "Job Count", "Total Core Hours", "$"]
          ];

          _.forEach($scope.jobSummary, function (summary) {
            data.push([
              summary.organisation,
              summary.username,
              summary.fullname,
              summary.email,
              $scope.formatNumber(summary.jobCount),
              $scope.formatNumber(summary.cpuSeconds / 3600),
              summary.cost
            ]);
          });

          /** Grand total data. */
          data.push([
            'Grand Total',
            ' - ',
            ' - ',
            ' - ',
            $scope.formatNumber($scope.jobCountSum),
            $scope.formatNumber($scope.cpuSecondsSum / 3600),
            $scope.costSum
          ]);
        }

        return data;
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