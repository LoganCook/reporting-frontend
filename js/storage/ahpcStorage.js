define(
  ["app", "lodash", "mathjs", "../util", "services/xfs"],
  function (app, _, math, util) {

  app.controller("AHPCStorageController", 
    ["$rootScope", "$scope", "$timeout", "$filter", "reporting", "org", "spinner", "XFSService", "theConstants", "AuthService",
    function ($rootScope, $scope, $timeout, $filter, reporting, org, spinner, XFSService, theConstants) {
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
      $scope.datepickerOptions = {minMode: 'month'}
      $scope.orderBySubTotalLast = theConstants.orderBySubTotalLast
      $scope.isSubTotalRow = theConstants.isSubTotalRow
      $scope.isFilterApplied = theConstants.isFilterApplied
      $scope.orderByNCols = theConstants.orderByNCols
      $scope.orderBy = theConstants.orderByPredicateThenSubTotal

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
            }, function(reason) {
              alert('Failed to retrieve XFS data: ' + reason)
              spinner.stop()
            })
        }, function(reason) {
          alert('Failed to retrieve XFS data: ' + reason)
          spinner.stop()
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