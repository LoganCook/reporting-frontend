define(
  ['app', 'options', '../util2', '../util', '../order-by-grand-last', './services', '../crm', './account', '../services/nectar'],
  function (app, options, util, oldUtil, orderByGrandLast) {
  'use strict';

  app.controller("NovasummaryController",
    ["$rootScope", "$scope", "$timeout", "$filter", "reporting", "org", "queryResource", "$q", "flavor", "tenant", "crm", "account", "spinner",
      "NectarService", "AuthService", "theConstants",
    function ($rootScope, $scope, $filter, timeout, reporting, org, queryResource, $q, flavor, tenant, crm, account, spinner,
      NectarService, AuthService, theConstants) {

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
      $scope.orderByGrandLast = orderByGrandLast
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
        NectarService.query(startTs, endTs).then(function () {
          console.log("Query of Nectar is done");
          $scope.usages = NectarService.getUsages(startTs, endTs, orgName);
          if (orgName) {
            var subTotals = angular.copy(NectarService.getSubTotals(startTs, endTs, orgName));
            $scope.grandTotal = oldUtil.spliceOne(subTotals, 'organisation', 'Grand');
            $scope.subTotals = subTotals;
          } else {
            $scope.subTotals = NectarService.getSubTotals(startTs, endTs);
            $scope.grandTotal = NectarService.getGrandTotal(startTs, endTs);
          }
          spinner.stop()
        }, function(reason) {
          spinner.stop()
          console.error("Failed request, ", reason);
        });
      };

      /**
       * When user change organisation on the page, this fucnction will be called
       * to filter data.
       *
       * TODO: make domain list updatable to allow filter
       */
      // $scope.selectDomain = function () {

      //   if ($scope.selectedDomain === '0') {
      //     console.log("Selected All");
      //     // $scope.instancesState = summaryInstances(cachedInstancesState);
      //     return;
      //   }

      //   var instanceStates = [];
      //   angular.forEach(cachedInstancesState, function (instance) {
      //     if (instance['organisation'] === $scope.selectedDomain) {
      //       instanceStates.push(instance);
      //     }
      //   });
      //   // $scope.instancesState = summaryInstances(instanceStates);
      // };


      // /**
      //  * request instance state
      //  *
      //  * @param {Array} states - array of instances
      //  * @return {Object} $q.defer
      //  */
      // function getInstanceState(states) {

      //   var deferred = $q.defer();
      //   var topOrg = [];

      //   if (states.length) {
      //     angular.forEach(states, function (instance) {
      //       var arr = instance['manager'];
      //       if (arr.length) {
      //         instance['organisation'] = arr[0];
      //         topOrg.push(arr[0]);
      //       } else {
      //         instance['organisation'] = ' - ';
      //       }
      //     });
      //     $scope.domains = _.union(topOrg);
      //     deferred.resolve(states);
      //   } else {
      //     deferred.reject(states);
      //   }
      //   return deferred.promise;
      // }
    }
  ]);
});