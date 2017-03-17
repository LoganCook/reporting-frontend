define(["app", '../options', "lodash", "mathjs", "../util", 'services/xfs'], function (app, options, _, math, util) {
  app.controller("HPCStorageController", ["$rootScope", "$scope", "$timeout", "$filter", "reporting", "org", "spinner", "XFSService", "AuthService",
    function ($rootScope, $scope, $timeout, $filter, reporting, org, spinner, XFSService, AuthService) {
      'use strict';

      var FILESYTEM_NAME = 'hpchome';

      /**
       * Whenever user click 'Update' button, this is called
       * to clear variable and remove stored data.
       *
       * @return {Void}
       */
      function clear() {
        $scope.output.summed = [];
        $scope.status = "No data loaded.";
      };

      // Used in template
      $scope.values = _.values;

      $scope.formatNumber = util.formatNumber;
      $scope.formatDuration = util.formatDuration;
      $scope.formatSize = util.formatSize;
      $scope.basename = util.basename;

      $scope.total = {};
      $scope.topOrgs = [];
      $scope.billingOrgs = [];

      $scope.details = {};

      $scope.selectedBillingOrg = '0';

      $scope.peak = 0;
      $scope.usageSum = 0;

      $scope.alerts = [];
      $scope.select = {
        host: null,
        snapshot: null,
        filesystem: null
      };

      $scope.xfs = {};

      $scope.output = {
        usage: [],
        summed: []
      };

      $scope.loggedInAsErsaUser = true;

      $scope.rangeStart = new Date();
      $scope.rangeEnd = new Date();
      $scope.rangeEndOpen = false;
      $scope.openRangeEnd = function () {
        $scope.rangeEndOpen = true;
      };
      $scope.datepickerOptions = {minMode: 'month'}

      // Request XFS data with qeury string.
      $scope.load = function () {
        clear();

        $scope.rangeStart = util.firstDayOfYearAndMonth($scope.rangeEnd);
        $scope.rangeEnd = util.lastDayOfYearAndMonth($scope.rangeEnd);

        var startTs = util.dayStart($scope.rangeStart);
        var endTs = util.dayEnd($scope.rangeEnd);

        spinner.start();
        XFSService.list().then(function () {
          var filesysteId = XFSService.getIdOf(FILESYTEM_NAME);
          XFSService.query(filesysteId, startTs, endTs)
            .then(function() {
              var orgName = AuthService.getUserOrgName();
              $scope.usages = XFSService.getUsages(filesysteId, startTs, endTs, orgName);
              var subTotals = angular.copy(XFSService.getTotals(filesysteId, startTs, endTs, orgName));
              $scope.grandTotal = util.spliceOne(subTotals, 'organisation', 'Grand');
              $scope.subTotals = subTotals;
              spinner.stop();
            }, function(reason) {
              alert('Failed: ' + reason);
              spinner.stop();
            });
        }, function(reason) {
          console.error("Failed to retrieve XFS data: " + reason)
        });
      };

      /**
       * Close alert message block
       */
      $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
      };
    }
  ]);
});