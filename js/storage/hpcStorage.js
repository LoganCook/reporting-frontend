define(["app", '../options', "lodash", "mathjs", "../util", 'services/xfs'], function (app, options, _, math, util) {
  app.controller("HPCStorageController", ["$rootScope", "$scope", "$timeout", "$filter", "reporting", "org", "spinner", "XFSService", "AuthService",
    function ($rootScope, $scope, $timeout, $filter, reporting, org, spinner, XFSService, AuthService) {
      'use strict';

      var FILESYTEM_NAME = 'hpchome', defaultPrice = 0;
      // FIXME: this is a temporary fix because there is no contract of HPC HOME STORAGE
      if (FILESYTEM_NAME in options && 'price' in options[FILESYTEM_NAME]) {
        defaultPrice = options[FILESYTEM_NAME]['price'];
      } else {
        throw ("HPC home storage price is not set in options.");
      }
      XFSService.loadPrice(defaultPrice);

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

      $scope.output = { // FIXME is this used?
        usage: [],
        summed: []
      };

      $scope.loggedInAsErsaUser = true;

      $scope.rangeStart = new Date();
      $scope.rangeEnd = options['hpchome']['lastReportMonth']['date'];
      $scope.rangeEndOpen = false;
      $scope.openRangeEnd = function () {
        $scope.rangeEndOpen = true;
      };
      $scope.datepickerOptions = {minMode: 'month'};

      // Request XFS data with query string.
      $scope.load = function () {
        if (XFSService.isLastReportMonth($scope.rangeEnd, options['hpchome']['lastReportMonth'])) return;
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
          console.error("Failed to retrieve XFS data: " + reason);
          spinner.stop();
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