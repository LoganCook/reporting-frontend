define(['app', 'options', '../util2', '../util', './services', '../crm', './account', '../services/nectar'], function (app, options, util, oldUtil) {
  'use strict';

  app.controller("NovasummaryController", ["$rootScope", "$scope", "$timeout", "$filter", "reporting", "org", "queryResource", "$q", "flavor", "tenant", "crm", "account", "spinner", "NectarService", "AuthService",
    function ($rootScope, $scope, $filter, timeout, reporting, org, queryResource, $q, flavor, tenant, crm, account, spinner, NectarService, AuthService) {

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
       * For creating table and exporting csv
       */
      $scope.colTitles = [];
      $scope.fieldNames = [];
      var fieldNames = [];
      if (AuthService.isAdmin()) {
        $scope.colTitles.push(['Organisation', 'Project', 'User Name', 'Email', 'School', 'Total Cores Used', 'Core Quota Allocated', 'Cost per Core Used', 'Server Name']);
        $scope.colTitles.push(['Organisation', 'Project', 'Total Cores Used', 'Core Quota Allocated', 'Cost per Core Used']);

        fieldNames.push(['organisation', 'tenantName', 'fullname', 'email', 'school', 'core', 'allocatedCore', 'cost', 'server']);
        fieldNames.push(['organisation', 'tenantName', 'core', 'allocatedCore', 'cost']);
      } else {
        $scope.colTitles.push(['Project', 'User Name', 'Email', 'School', 'Total Cores Used', 'Core Quota Allocated', 'Cost per Core Used', 'Server Name']);
        $scope.colTitles.push(['Project', 'Total Cores Used', 'Core Quota Allocated', 'Cost per Core Used']);

        fieldNames.push(['tenantName', 'fullname', 'email', 'school', 'core', 'allocatedCore', 'cost', 'server']);
        fieldNames.push(['tenantName', 'core', 'allocatedCore', 'cost']);
      }

      $scope.fieldNames = fieldNames[1];


      /**
       * retrieve data with qeury string.
       */
      $scope.load = function () {
        $scope.rangeStart = oldUtil.firstDayOfYearAndMonth($scope.rangeEnd);
        $scope.rangeEnd = oldUtil.lastDayOfYearAndMonth($scope.rangeEnd);

        var startTs = util.dateToTimestamp($scope.rangeStart);
        var endTs = util.dateToTimestamp($scope.rangeEnd, true);

        $scope.selectedDomain = '0';
        $scope.serverChecked = false;
        $scope.instancesState = [];

        console.log(startTs, endTs);

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
        });
      };


      /**
       * create TSV file data with summary data that has already fetched and stored.
       *
       * @export
       * @return{Array} data
       */
      $scope.export = function () {
        var rowCount = $scope.instancesState.length;
        var csvData = Array(rowCount + 1);

        var fieldCount = $scope.fieldNames.length,
          i, j;
        for (i = 0; i < rowCount; i++) {
          csvData[i + 1] = Array(fieldCount);
          for (j = 0; j < fieldCount; j++) {
            csvData[i + 1][j] = $scope.instancesState[i][$scope.fieldNames[j]];
          }
        }

        csvData.sort(function (a, b) {
          if (a[0] >= b[0]) {
            return 1;
          }
          return -1;
        });

        csvData[0] = $scope.colTitles[$scope.serverChecked ? 0 : 1];

        /** Grand total data. */
        if ($scope.loggedInAsErsaUser) {

          if ($scope.serverChecked) {
            csvData.push([
              'Grand Total',
              ' - ',
              ' - ',
              ' - ',
              ' - ',
              $scope.sum.coreAllocation,
              ' - ',
              '$' + $scope.sum.cost.toFixed(2),
              ' - '
            ]);
          } else {
            csvData.push([
              'Grand Total',
              ' - ',
              $scope.sum.coreAllocation,
              ' - ',
              '$' + $scope.sum.cost.toFixed(2)
            ]);
          }
        } else {
          if ($scope.serverChecked) {
            csvData.push([
              'Grand Total',
              ' - ',
              ' - ',
              ' - ',
              $scope.sum.coreAllocation,
              ' - ',
              '$' + $scope.sum.cost.toFixed(2),
              ' - '
            ]);
          } else {
            csvData.push([
              'Grand Total',
              $scope.sum.coreAllocation,
              ' - ',
              '$' + $scope.sum.cost.toFixed(2)
            ]);
          }
        }
        return csvData;
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