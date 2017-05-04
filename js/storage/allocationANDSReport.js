define(
  ["app", "../countdown-latch", "services/anzsrc-for"],
  function (app, countdownLatch) {
    app.controller("AllocationANDSReportController", ["$rootScope", "$scope", "org", "spinner", "AuthService", "RDService", "FORService",
      function ($rootScope, $scope, org, spinner, AuthService, RDService, FORService) {
        $scope.alerts = [];
        $scope.usages = [];

        function mergeRecords(dataArray, key, mergeField) {
          var dict = {},
            result = [];
          dataArray.forEach(function (item) {
            if (key in item) {
              if (item[key] in dict) {
                if (mergeField in item) {
                  dict[item[key]][mergeField] += '; ' + item[mergeField];
                }
              } else {
                dict[item[key]] = item;
              }
            }
          });
          Object.keys(dict).forEach(function (item) {
            result.push(dict[item]);
          });
          return result;
        }

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
            $scope.usages = mergeRecords(data, 'orderID', 'FileSystemName');
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
