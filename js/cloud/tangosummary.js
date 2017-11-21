define(
  ['app', 'options', '../util2', '../util', './services', '../crm', './account', '../services/tangocloud'],
  function (app, options, util, oldUtil) {
  'use strict';

  app.controller("TangoCloudsummaryController",
    ["$rootScope", "$scope", "reporting", "org", "queryResource", "$q", "crm", "account", "spinner",
      "TangoCloudService", "AuthService", "theConstants",
    function ($rootScope, $scope, reporting, org, queryResource, $q, crm, account, spinner,
      TangoCloudService, AuthService, theConstants) {

      var orgName;
      if (!(AuthService.isAdmin())) {
        orgName = AuthService.getUserOrgName();
      }

      /**
       * defaults
       */
      $scope.domains = [];
      $scope.selectedDomain = '0';
      $scope.instancesState = [];
      $scope.serverChecked = false;
      $scope.datepickerOptions = {minMode: 'month'}
      $scope.isSubTotalRow = theConstants.isSubTotalRow

      /**
       * summary variables
       */
      $scope.sum = {
        core: 0,
        coreAllocation: 0,
        cost: 0
      };

      /**
       * search range
       */
      $scope.rangeStart = new Date();
      $scope.rangeEnd = new Date();
      $scope.rangeEndOpen = false;
      $scope.openRangeEnd = function () {
        $scope.rangeEndOpen = true;
      };

      $scope.orderBy = theConstants.orderByPredicateThenSubTotal
      $scope.isFilterApplied = theConstants.isFilterApplied
      /**
       * retrieve data with query string.
       */
      $scope.load = function () {
        $scope.rangeStart = oldUtil.firstDayOfYearAndMonth($scope.rangeEnd);
        $scope.rangeEnd = oldUtil.lastDayOfYearAndMonth($scope.rangeEnd);

        var startTs = util.dateToTimestamp($scope.rangeStart);
        var endTs = util.dateToTimestamp($scope.rangeEnd, true);

        $scope.selectedDomain = '0';
        $scope.serverChecked = false;
        $scope.instancesState = [];

        spinner.start()
        TangoCloudService.query(startTs, endTs).then(function () {
          console.log("Query of Tango Cloud is done");
          $scope.usages = TangoCloudService.getUsages(startTs, endTs, orgName);
          if (orgName) {
            var subTotals = angular.copy(TangoCloudService.getSubTotals(startTs, endTs, orgName));
            $scope.grandTotal = oldUtil.spliceOne(subTotals, 'organisation', 'Grand');
            $scope.subTotals = subTotals;
          } else {
            $scope.subTotals = TangoCloudService.getSubTotals(startTs, endTs);
            $scope.grandTotal = TangoCloudService.getGrandTotal(startTs, endTs);
          }
          spinner.stop()
        }, function(reason) {
          spinner.stop()
          console.error("Failed request, ", reason);
        });
      };
    }
  ]);
});