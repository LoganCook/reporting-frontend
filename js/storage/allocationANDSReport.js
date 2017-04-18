define(
  ["app", "../countdown-latch", "services/anzsrc-for"],
  function (app, countdownLatch) {
    app.controller("AllocationANDSReportController", ["$rootScope", "$scope", "org", "spinner", "AuthService", "RDService", "FORService",
      function ($rootScope, $scope, org, spinner, AuthService, RDService, FORService) {
        $scope.alerts = [];
        $scope.usages = [];

        var numberOfServiceCalls = 2;
        spinner.start();
        var orgName;
        if (!(AuthService.isAdmin())) {
          orgName = AuthService.getUserOrgName();
        }
        var latch = new countdownLatch(numberOfServiceCalls);
        latch.await(function() {
          spinner.stop();
        });

        RDService.getServiceMetaArrayOf(org.getOrganisationId(orgName), 'ands_report')
          .then(function (data) {
            $scope.usages = data;
            latch.countDown();
          }, function(reason) {
          latch.countDown();
          console.error("RDService.getServiceMetaArrayOf failed, ", reason);
        });
        FORService.getFORsOf(org.getOrganisationId(orgName))
          .then(function (data) {
            $scope.usages.forEach(function (entry) {
              if (entry['salesorderid'] in data) {
                entry['fors'] = data[entry['salesorderid']].join('; ');
              } else {
                entry['fors'] = '';
              }
            });
            latch.countDown()
          }, function(reason) {
          latch.countDown();
          console.error("FORService.getFORsOf failed, ", reason);
        });
      }
    ]);
  });
