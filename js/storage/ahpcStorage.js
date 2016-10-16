define(["app", "lodash", "mathjs", "../util", 'services/xfs'], function (app, _, math, util) {
  app.controller("AHPCStorageController", ["$rootScope", "$scope", "$timeout", "$filter", "reporting", "org", "spinner", "XFSService", "AuthService",
    function ($rootScope, $scope, $timeout, $filter, reporting, org, spinner, XFSService) {
      'use strict';
      var FILESYTEM_NAME = 'hpchome';

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




      /**
       * create TSV file data with summary data that has already fetched and stored.
       *
       * @export
       * @return{Array} data
       */
      $scope.export = function () {
        var records = [];
        var data = [];

        if ($scope.loggedInAsErsaUser) {
          _.forEach($scope.output.summed, function (entry) {
            records.push([
              entry.organisation,
              entry.school,
              entry.username,
              entry.fullname,
              entry.email,
              entry['usage'],
              entry.blocks,
              '$' + $scope.formatNumber(entry.cost) + '.00'
            ]);
          });

          records = $filter('orderBy')(records, [0, 1]);

          data = [
            ["Organisation", "School", "User ID", "User Name", "Email", "Total GB Used", "250GB blocks Allocated", "Cost per blocks"]
          ];

          Array.prototype.push.apply(data, records);

          /** Grand total data. */
          data.push([
            'Grand Total',
            ' - ',
            ' - ',
            ' - ',
            ' - ',
            $scope.total.currentUsage.toFixed(2),
            $scope.total.blocks,
            '$' + $scope.formatNumber($scope.total.cost) + '.00'
          ]);

        } else {
          _.forEach($scope.output.summed, function (entry) {
            records.push([
              entry.school,
              entry.username,
              entry.fullname,
              entry.email,
              entry['usage'],
              entry.blocks,
              '$' + $scope.formatNumber(entry.cost) + '.00'
            ]);
          });

          records = $filter('orderBy')(records, [0, 1]);

          data = [
            ["School", "User ID", "User Name", "Email", "Total GB Used", "250GB blocks Allocated", "Cost per blocks"]
          ];

          Array.prototype.push.apply(data, records);

          /** Grand total data. */
          data.push([
            'Grand Total',
            ' - ',
            ' - ',
            ' - ',
            $scope.total.currentUsage.toFixed(2),
            $scope.total.blocks,
            '$' + $scope.formatNumber($scope.total.cost) + '.00'
          ]);
        }
        return data;
      };


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
              $scope.output.summed = XFSService.getUsages(filesysteId, startTs, endTs);
              var totals = XFSService.getTotals(filesysteId, startTs, endTs);
              $scope.subTotals = totals;
              $scope.total = XFSService.getGrandTotals(filesysteId, startTs, endTs);
              spinner.stop();
            });
        }, function(reason) {
              alert('Failed: ' + reason);
              spinner.stop();
            });
      };

      /**
       * When user click a close alert button on the page, this fucnction will be called
       * to remove warnning message.
       *
       * @export
       */
      $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
      };
    }
  ]);
});