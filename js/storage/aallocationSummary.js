define(
  ["app", "lodash", "../util", "../countdown-latch", "../order-by-grand-last", "services/xfs.usage", "services/hnas.vv", "services/hnas.fs"],
  function (app, _, util, countdownLatch, orderByGrandLast) {

  app.controller("AAllocationSummaryController", ["$rootScope", "$scope", "$timeout", "$q", "$filter", "reporting", "org", "spinner", "AuthService", "RDService", "XFSUsageService", "HNASVVService", "HNASFSService",
    function ($rootScope, $scope, $timeout, $q, $filter, reporting, org, spinner, AuthService, RDService, XFSUsageService, HNASVVService, HNASFSService) {

      $scope.formatSize = util.formatSize;
      $scope.formatTimestamp = util.formatTimeSecStamp;
      $scope.formatNumber = util.formatNumber;
      $scope.formatDuration = util.formatDuration;

      $scope.alerts = [];
      $scope.usages = [];
      $scope.total = {};

      $scope.rangeStart = new Date();
      $scope.rangeEnd = new Date();
      $scope.rangeEndOpen = false;
      $scope.openRangeEnd = function () {
        $scope.rangeEndOpen = true;
      };
      $scope.datepickerOptions = {minMode: 'month'}
      $scope.orderByGrandLast = orderByGrandLast

      function addServiceTotal(serviceTotal, subTotals) {
        var k1 = 'billing', k2 = 'organisation';
        var totalMap = util.inflate(serviceTotal, k1, k2),
          gTotalMap = util.inflate(subTotals, k1, k2); // inflate totals
        var level1, level2;
        for (level1 in totalMap) {
          if (!(level1 in gTotalMap)) {
            gTotalMap[level1] = {};
          }
          for (level2 in totalMap[level1]) {
            if (level2 in gTotalMap[level1]) {
              gTotalMap[level1][level2]['usage'] += totalMap[level1][level2]['usage'];
              gTotalMap[level1][level2]['blocks'] += totalMap[level1][level2]['blocks'];
              gTotalMap[level1][level2]['cost'] += totalMap[level1][level2]['cost'];
            } else {
              gTotalMap[level1][level2] = totalMap[level1][level2];
            }
          }
        }
        return util.deflate(gTotalMap, k1, k2);
      }

      function updateGrandTotal(newTotal, currentTotal) {
        var fields = ['usage', 'blocks', 'cost'], l = fields.length, i = 0;
        for (i; i < l; i++) {
          currentTotal[fields[i]] += newTotal[fields[i]];
        }
      }

      $scope.load = function () {
        spinner.start();
        $scope.rangeStart = util.firstDayOfYearAndMonth($scope.rangeEnd);
        $scope.rangeEnd = util.lastDayOfYearAndMonth($scope.rangeEnd);

        var startTs = util.dayStart($scope.rangeStart);
        var endTs = util.dayEnd($scope.rangeEnd);
        var orgName;
        if (!(AuthService.isAdmin())) {
          orgName = AuthService.getUserOrgName();
        }
        $scope.usages = [];
        $scope.subTotals = [];
        $scope.total = {
          'usage': 0,
          'blocks': 0,
          'cost': 0
        };

        var numberOfServiceCalls = 3
        var latch = new countdownLatch(numberOfServiceCalls)
        latch.await(function() {
          spinner.stop()
        })
        XFSUsageService.query(startTs, endTs).then(function() {
          $scope.usages = $scope.usages.concat(XFSUsageService.getUsages(startTs, endTs, orgName));
          $scope.subTotals1 = XFSUsageService.getTotals(startTs, endTs, orgName);
          $scope.subTotals = addServiceTotal(XFSUsageService.getTotals(startTs, endTs, orgName), $scope.subTotals);
          updateGrandTotal(XFSUsageService.getGrandTotals(startTs, endTs), $scope.total);
          latch.countDown()
        }, function(reason) {
          latch.countDown()
          console.error("Failed request, ", reason);
        });
        HNASVVService.query(startTs, endTs).then(function() {
          // $scope.test2 = HNASVVService.getUsages(startTs, endTs, orgName);
          $scope.usages = $scope.usages.concat(HNASVVService.getUsages(startTs, endTs, orgName));
          // $scope.subTotals2 = HNASVVService.getTotals(startTs, endTs, orgName);
          $scope.subTotals = addServiceTotal(HNASVVService.getTotals(startTs, endTs, orgName), $scope.subTotals);
          updateGrandTotal(HNASVVService.getGrandTotals(startTs, endTs), $scope.total);
          latch.countDown()
        }, function(reason) {
          latch.countDown()
          console.error("Failed request, ", reason);
        });
        HNASFSService.query(startTs, endTs).then(function() {
          // $scope.test3 = HNASFSService.getUsages(startTs, endTs, orgName);
          // $scope.subTotals3 = HNASFSService.getTotals(startTs, endTs, orgName);
          $scope.usages = $scope.usages.concat(HNASFSService.getUsages(startTs, endTs, orgName));
          $scope.subTotals = addServiceTotal(HNASFSService.getTotals(startTs, endTs, orgName), $scope.subTotals);
          updateGrandTotal(HNASFSService.getGrandTotals(startTs, endTs), $scope.total);
          latch.countDown()
        }, function(reason) {
          latch.countDown()
          console.error("Failed request, ", reason);
        });
      };
    }
  ]);
});