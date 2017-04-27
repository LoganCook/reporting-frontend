define(
  ["app", "../util", "../countdown-latch", "services/xfs.usage", "services/hnas.vv", "services/hnas.fs", "services/hcp"],
  function (app, util, countdownLatch) {
  
  app.controller("AllocationSummaryController", ["$rootScope", "$scope", "$timeout", "$q", "$filter", "reporting", "org", "spinner", "AuthService", "RDService", "XFSUsageService",
      "HNASVVService", "HNASFSService", "HCPService",
    function ($rootScope, $scope, $timeout, $q, $filter, reporting, org, spinner, AuthService, RDService, XFSUsageService,
      HNASVVService, HNASFSService, HCPService) {
      // AllocationSummary for instituational users
      $scope.formatSize = util.formatSize;
      $scope.formatTimestamp = util.formatTimeSecStamp;
      $scope.formatNumber = util.formatNumber;
      $scope.formatDuration = util.formatDuration;

      $scope.alerts = [];

      $scope.usages = [];

      $scope.rangeStart = new Date();
      $scope.rangeEnd = new Date();
      $scope.rangeEndOpen = false;
      $scope.openRangeEnd = function () {
        $scope.rangeEndOpen = true;
      };
      $scope.datepickerOptions = {minMode: 'month'}

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

      $scope.load = function () {
        spinner.start();
        $scope.rangeStart = util.firstDayOfYearAndMonth($scope.rangeEnd);
        $scope.rangeEnd = util.lastDayOfYearAndMonth($scope.rangeEnd);

        var startTs = util.dayStart($scope.rangeStart);
        var endTs = util.dayEnd($scope.rangeEnd);
        var orgName, subTotals = []
        if (!(AuthService.isAdmin())) {
          orgName = AuthService.getUserOrgName();
        }
        $scope.usages = [];
        var numberOfServiceCalls = 4
        var latch = new countdownLatch(numberOfServiceCalls)
        latch.await(function() {
          spinner.stop()
        })
        function doCall (service) {
          service.query(startTs, endTs).then(function() {
            $scope.usages = $scope.usages.concat(service.getUsages(startTs, endTs, orgName))
            subTotals = addServiceTotal(service.getTotals(startTs, endTs, orgName), subTotals)
            var tmpSubTotals = angular.copy(subTotals)
            $scope.total = util.spliceOne(tmpSubTotals, 'organisation', 'Grand')
            $scope.subTotals = tmpSubTotals
            latch.countDown()
          }, function(reason) {
            latch.countDown()
            console.error("Failed request, ", reason)
          })
        }
        doCall(XFSUsageService)
        doCall(HNASVVService)
        doCall(HNASFSService)
        doCall(HCPService)
      };
    }
  ]);
});